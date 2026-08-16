# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║         NeuroFinance — Stock Price Direction Predictor                       ║
║         Classificação Binária: 1 = Vai Subir  |  0 = Vai Cair/Manter       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Pipeline:
    1. ETL       — Carregamento e limpeza dos dados
    2. Features  — Engenharia de indicadores técnicos
    3. Modelo    — Treinamento com validação temporal
    4. Avaliação — Métricas e visualização dos resultados

Uso:
    python stock_predictor.py
    python stock_predictor.py --company AAPL --model gbm
"""

import argparse
import sys
import warnings
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    ConfusionMatrixDisplay,
)
from sklearn.preprocessing import StandardScaler

# Configura stdout para UTF-8 em terminais Windows (evita UnicodeEncodeError)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURAÇÕES GLOBAIS
# ──────────────────────────────────────────────────────────────────────────────
DATA_PATH = Path("static/stock_details_5_years.csv")
DEFAULT_COMPANY = "GOOGL"
TEST_RATIO = 0.20          # 20% dos dados mais recentes usados para teste
RANDOM_STATE = 42


# ══════════════════════════════════════════════════════════════════════════════
# ETAPA 1: ETL — Carregamento e Limpeza de Dados
# ══════════════════════════════════════════════════════════════════════════════

def load_and_clean(data_path: Path, company: str) -> pd.DataFrame:
    """
    Carrega o CSV, filtra por empresa, limpa e ordena cronologicamente.

    Decisões de design:
    - A coluna Date vem com timezone (-05:00). Fazemos utc=True para normalizar
      e depois convertemos para timezone-naive (date only) para facilitar plots.
    - Removemos 'Dividends' e 'Stock Splits' da análise preditiva porque esses
      eventos são discretos e raros, e o modelo pode decorar padrões espúrios
      associados a eles (data leakage indireta).
    - Linhas com NaN em OHLCV são descartadas (quantidade residual no dataset).

    Args:
        data_path: caminho para o arquivo CSV
        company:   ticker da empresa (ex: 'GOOGL')

    Returns:
        DataFrame limpo, indexado por data, ordenado cronologicamente.
    """
    print(f"\n{'='*60}")
    print(f"  [ETL] Carregando dados para: {company}")
    print(f"{'='*60}")

    # ── Leitura (sem parse_dates pois o formato inclui timezone)
    df = pd.read_csv(data_path)

    print(f"  Dataset completo: {len(df):,} linhas | {df['Company'].nunique()} empresas")

    # ── Filtro por empresa (antes do parse para maior performance)
    df = df[df["Company"] == company].copy()

    if df.empty:
        raise ValueError(
            f"Empresa '{company}' não encontrada. "
            f"Exemplos disponíveis: {pd.read_csv(data_path, usecols=['Company'])['Company'].unique()[:10].tolist()}"
        )

    # ── Normalização da coluna de data
    # O CSV tem datas com timezone (ex: 2018-11-29 00:00:00-05:00).
    # pd.to_datetime com utc=True converte corretamente strings com qualquer offset.
    # Depois removemos o timezone para trabalhar apenas com datas no formato YYYY-MM-DD.
    df["Date"] = pd.to_datetime(df["Date"], utc=True).dt.tz_localize(None)
    df["Date"] = df["Date"].dt.normalize()  # mantém só a parte da data

    # ── Ordenação cronológica (crítico para divisão temporal)
    df = df.sort_values("Date").reset_index(drop=True)

    # ── Remoção de colunas não usadas na predição
    df = df.drop(columns=["Dividends", "Stock Splits", "Company"])

    # ── Tratamento de valores nulos em colunas OHLCV
    before = len(df)
    df = df.dropna(subset=["Open", "High", "Low", "Close", "Volume"])
    after = len(df)

    if before - after > 0:
        print(f"  [Limpeza] Removidas {before - after} linhas com NaN em OHLCV")

    # ── Remoção de dias com volume zero (mercado fechado / dados corrompidos)
    df = df[df["Volume"] > 0]

    print(f"  Registros após limpeza: {len(df):,}")
    print(f"  Periodo: {df['Date'].min().date()}  ->  {df['Date'].max().date()}")
    print(f"  Close mín/máx: ${df['Close'].min():.2f} / ${df['Close'].max():.2f}")

    return df.set_index("Date")


# ══════════════════════════════════════════════════════════════════════════════
# ETAPA 2: Feature Engineering — Indicadores Técnicos
# ══════════════════════════════════════════════════════════════════════════════

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cria indicadores técnicos a partir dos dados OHLCV e define a variável alvo.

    ── Indicadores criados ───────────────────────────────────────────────────

    1. SMA_7 / SMA_21 (Simple Moving Average)
       Média aritmética dos últimos N fechamentos. Captura tendência de
       curto e médio prazo. A diferença entre SMA_7 e SMA_21 (cross-over)
       é um sinal clássico de compra/venda.

    2. Price_vs_SMA7 / Price_vs_SMA21
       Posição relativa do preço atual em relação à média móvel.
       Valores positivos = preço acima da média (momento de alta).

    3. Daily_Return (variação % do fechamento)
       Log-return diário: ln(Close_t / Close_{t-1}).
       Preferimos log-return ao return simples porque tem propriedades
       estatísticas melhores (simetria, aditividade temporal).

    4. Volatility_7 / Volatility_21
       Desvio padrão rolante dos retornos. Mede o risco/incerteza do ativo.
       Alta volatilidade geralmente precede reversões de tendência.

    5. Price_Range (High - Low)
       Amplitude diária do preço. Reflete a "energia" do mercado naquele dia.

    6. Volume_Change (variação % do volume)
       Pico de volume frequentemente confirma rompimentos (breakouts).

    7. RSI_14 (Relative Strength Index)
       Oscilador de momentum clássico (0–100).
       RSI < 30 → sobrevendido (possível reversão de alta)
       RSI > 70 → sobrecomprado (possível reversão de baixa)

    8. MACD / MACD_Signal / MACD_Hist
       Moving Average Convergence Divergence.
       Mede a convergência/divergência entre EMA_12 e EMA_26.
       Sinal de compra quando MACD cruza acima da linha de sinal.

    9. BB_Width (Bollinger Bands Width)
       Largura das Bandas de Bollinger (σ normalizado).
       Squeezes de BB antecipam movimentos bruscos de preço.

    10. Lag features (Close_Lag1, Return_Lag1, Return_Lag2, Return_Lag3)
        Valores defasados incorporam informação de momentum recente
        sem causar data leakage (usamos apenas o passado).

    ── Variável Alvo ─────────────────────────────────────────────────────────

    Target = 1 se Close[t+1] > Close[t], senão 0.

    Usamos shift(-1) para "ver" o fechamento do próximo dia.
    Após criar o target, removemos a última linha (que teria NaN no target).

    ATENÇÃO: qualquer feature que use dados futuros (t+1, t+2, ...) causaria
    data leakage. Todas as features aqui usam apenas dados de t para trás.
    """
    print(f"\n{'='*60}")
    print("  [Features] Engenharia de indicadores técnicos")
    print(f"{'='*60}")

    feat = df.copy()

    # ── 1. Médias Móveis Simples
    feat["SMA_7"]  = feat["Close"].rolling(window=7).mean()
    feat["SMA_21"] = feat["Close"].rolling(window=21).mean()
    feat["SMA_50"] = feat["Close"].rolling(window=50).mean()

    # ── 2. Posição relativa ao preço
    feat["Price_vs_SMA7"]  = (feat["Close"] - feat["SMA_7"])  / feat["SMA_7"]
    feat["Price_vs_SMA21"] = (feat["Close"] - feat["SMA_21"]) / feat["SMA_21"]

    # ── 3. Log-Return diário (evita divisão problemática perto de zero)
    feat["Daily_Return"] = np.log(feat["Close"] / feat["Close"].shift(1))

    # ── 4. Volatilidade rolante (desvio padrão dos log-returns)
    feat["Volatility_7"]  = feat["Daily_Return"].rolling(window=7).std()
    feat["Volatility_21"] = feat["Daily_Return"].rolling(window=21).std()

    # ── 5. Amplitude diária
    feat["Price_Range"] = (feat["High"] - feat["Low"]) / feat["Close"]

    # ── 6. Variação de volume
    feat["Volume_Change"] = feat["Volume"].pct_change()

    # ── 7. RSI-14
    delta = feat["Close"].diff()
    gain  = delta.clip(lower=0)
    loss  = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / (avg_loss + 1e-9)  # epsilon para evitar divisão por zero
    feat["RSI_14"] = 100 - (100 / (1 + rs))

    # ── 8. MACD (12-26-9)
    ema_12 = feat["Close"].ewm(span=12, adjust=False).mean()
    ema_26 = feat["Close"].ewm(span=26, adjust=False).mean()
    feat["MACD"]        = ema_12 - ema_26
    feat["MACD_Signal"] = feat["MACD"].ewm(span=9, adjust=False).mean()
    feat["MACD_Hist"]   = feat["MACD"] - feat["MACD_Signal"]

    # ── 9. Bollinger Band Width
    bb_mid  = feat["Close"].rolling(window=20).mean()
    bb_std  = feat["Close"].rolling(window=20).std()
    feat["BB_Width"] = (2 * bb_std) / (bb_mid + 1e-9)

    # ── 10. Lag features (momentum recente)
    feat["Close_Lag1"]  = feat["Close"].shift(1)
    feat["Return_Lag1"] = feat["Daily_Return"].shift(1)
    feat["Return_Lag2"] = feat["Daily_Return"].shift(2)
    feat["Return_Lag3"] = feat["Daily_Return"].shift(3)

    # ── Variável Alvo
    # Deslocamento de -1: "o fechamento de amanhã é maior que o de hoje?"
    # shift(-1) traz o valor futuro — mas removemos a última linha com dropna,
    # garantindo que nunca usamos dados futuros nas features.
    feat["Target"] = (feat["Close"].shift(-1) > feat["Close"]).astype(int)

    # ── Remoção de NaNs (períodos de warm-up dos indicadores)
    before = len(feat)
    
    # Salvar a última linha (que tem Target=NaN) para inferência futura
    inference_row = feat.iloc[[-1]].copy()
    
    feat = feat.dropna()
    print(f"  Linhas removidas (warm-up de indicadores): {before - len(feat)}")
    print(f"  Dataset final com features: {len(feat):,} dias úteis")
    print(f"  Distribuição do Target: Alta={feat['Target'].sum()} | Baixa/Manter={( feat['Target']==0).sum()}")

    # Adicionar o inference_row ao atributo do módulo para acesso fácil
    import sys
    this_module = sys.modules[__name__]
    this_module.LATEST_INFERENCE_ROW = inference_row

    return feat


# ══════════════════════════════════════════════════════════════════════════════
# ETAPA 3: Divisão Temporal e Treinamento do Modelo
# ══════════════════════════════════════════════════════════════════════════════

FEATURE_COLS = [
    "Open", "High", "Low", "Close", "Volume",
    "SMA_7", "SMA_21", "SMA_50",
    "Price_vs_SMA7", "Price_vs_SMA21",
    "Daily_Return", "Volatility_7", "Volatility_21",
    "Price_Range", "Volume_Change",
    "RSI_14",
    "MACD", "MACD_Signal", "MACD_Hist",
    "BB_Width",
    "Close_Lag1", "Return_Lag1", "Return_Lag2", "Return_Lag3",
]


def split_temporal(df: pd.DataFrame, test_ratio: float = TEST_RATIO):
    """
    Divisão treino/teste respeitando a ordem cronológica.

    ── Por que NÃO embaralhar? ───────────────────────────────────────────────
    Em séries temporais, os dados têm dependência sequencial (autocorrelação).
    Se embaralharmos, o modelo vê dados "futuros" durante o treino (data
    leakage temporal), inflando artificialmente as métricas. A abordagem
    correta é usar os dados mais ANTIGOS para treino e os mais RECENTES
    para teste — simulando o cenário real de produção.

    Args:
        df:         DataFrame com features e Target
        test_ratio: proporção de dados usada para teste (ex: 0.20 = 20%)

    Returns:
        X_train, X_test, y_train, y_test, df_test (para plots)
    """
    print(f"\n{'='*60}")
    print("  [Modelo] Divisão temporal treino/teste")
    print(f"{'='*60}")

    split_idx = int(len(df) * (1 - test_ratio))

    X = df[FEATURE_COLS]
    y = df["Target"]

    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    df_test = df.iloc[split_idx:]

    print(f"  Treino: {len(X_train):,} dias  ({df.index[0].date()} → {df.index[split_idx-1].date()})")
    print(f"  Teste : {len(X_test):,} dias  ({df.index[split_idx].date()} → {df.index[-1].date()})")

    return X_train, X_test, y_train, y_test, df_test


def build_model(model_type: str = "gbm"):
    """
    Instancia o classificador escolhido com hiperparâmetros ajustados para
    dados de séries temporais financeiras.

    ── Escolha do modelo ─────────────────────────────────────────────────────
    - GBM (Gradient Boosting): melhor acurácia em dados tabulares com relações
      não-lineares complexas. Treina sequencialmente, corrigindo erros do
      modelo anterior. Ligeiramente mais lento que RF.

    - Random Forest: robusto, paralelo, menos propenso a overfitting em
      datasets menores. Boa linha de base para comparação.

    Args:
        model_type: 'gbm' (padrão) ou 'rf'

    Returns:
        estimador scikit-learn não treinado
    """
    if model_type == "rf":
        return RandomForestClassifier(
            n_estimators=300,
            max_depth=6,
            min_samples_leaf=20,       # evita overfitting em séries curtas
            max_features="sqrt",
            class_weight="balanced",   # compensa possível desbalanceamento
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )
    else:  # gbm
        return GradientBoostingClassifier(
            n_estimators=300,
            learning_rate=0.05,        # taxa baixa + mais árvores = melhor generalização
            max_depth=4,
            subsample=0.8,             # estocástico: reduz overfitting
            min_samples_leaf=20,
            random_state=RANDOM_STATE,
        )


def train_model(X_train, y_train, model_type: str = "gbm"):
    """
    Aplica StandardScaler e treina o modelo.

    Note: StandardScaler é calculado APENAS no conjunto de treino e depois
    aplicado ao teste — evitando contaminação estatística.

    Returns:
        model (treinado), scaler (ajustado no treino)
    """
    print(f"\n  Treinando modelo: {'Gradient Boosting' if model_type == 'gbm' else 'Random Forest'}")

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    model = build_model(model_type)
    model.fit(X_train_scaled, y_train)

    print("  ✓ Treinamento concluído!")
    return model, scaler


# ══════════════════════════════════════════════════════════════════════════════
# ETAPA 4: Avaliação e Visualização
# ══════════════════════════════════════════════════════════════════════════════

def evaluate_model(model, scaler, X_test, y_test):
    """
    Calcula e exibe as métricas de avaliação do modelo.

    ── Interpretação das métricas ─────────────────────────────────────────────
    - Accuracy:  % de previsões corretas no total.
    - Precision: dos dias que o modelo previu ALTA, quantos realmente subiram?
                 Alta precision = menos falsos alarmes (compras erradas).
    - Recall:    dos dias que o ativo realmente subiu, quantos o modelo captou?
                 Alto recall = perde menos oportunidades de compra.
    - F1-Score:  média harmônica entre Precision e Recall. Útil quando as
                 classes são levemente desbalanceadas.

    Num contexto de trading, geralmente priorizamos Precision (para evitar
    entrar em posições ruins) mas o trade-off depende da estratégia.
    """
    print(f"\n{'='*60}")
    print("  [Avaliação] Métricas de desempenho no conjunto de teste")
    print(f"{'='*60}")

    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec  = recall_score(y_test, y_pred, zero_division=0)
    f1   = f1_score(y_test, y_pred, zero_division=0)

    print(f"\n  {'Métrica':<20} {'Valor':>8}")
    print(f"  {'-'*30}")
    print(f"  {'Accuracy':<20} {acc:>8.4f}  ({acc*100:.1f}%)")
    print(f"  {'Precision (Alta)':<20} {prec:>8.4f}  ({prec*100:.1f}%)")
    print(f"  {'Recall (Alta)':<20} {rec:>8.4f}  ({rec*100:.1f}%)")
    print(f"  {'F1-Score':<20} {f1:>8.4f}")

    print("\n  Relatório completo:")
    print(classification_report(y_test, y_pred, target_names=["Cair/Manter", "Subir"]))

    return y_pred, y_prob


def plot_feature_importance(model, model_type: str, top_n: int = 15) -> plt.Figure:
    """Plota as N features mais importantes para a decisão do modelo."""
    if not hasattr(model, "feature_importances_"):
        return None

    importances = pd.Series(model.feature_importances_, index=FEATURE_COLS)
    importances = importances.nlargest(top_n).sort_values()

    fig, ax = plt.subplots(figsize=(9, 6))
    bars = ax.barh(
        importances.index,
        importances.values,
        color=plt.cm.viridis(np.linspace(0.2, 0.8, len(importances))),
        edgecolor="white",
        linewidth=0.5,
    )
    ax.set_title(
        f"Top {top_n} Features — {'Gradient Boosting' if model_type == 'gbm' else 'Random Forest'}",
        fontsize=13, fontweight="bold", pad=14,
    )
    ax.set_xlabel("Importância relativa", fontsize=10)
    ax.grid(axis="x", alpha=0.3)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig


def plot_predictions(df_test: pd.DataFrame, y_pred: np.ndarray, company: str,
                     last_n: int = 100) -> plt.Figure:
    """
    Gráfico dos últimos N dias com destaque para as previsões corretas de alta.

    Legenda visual:
    - Linha azul escura: preço de fechamento real
    - ▲ Verde sólido  : modelo previu ALTA e o preço SUBIU (acerto)
    - ▲ Laranja claro : modelo previu ALTA mas o preço CAIU (erro)
    - ● Cinza         : modelo previu BAIXA/MANTER (neutro)
    """
    # Slice dos últimos N dias
    df_plot = df_test.iloc[-last_n:].copy()
    preds   = y_pred[-last_n:]
    actual  = df_plot["Target"].values

    dates  = df_plot.index
    closes = df_plot["Close"].values

    # Categorias de pontos
    mask_hit   = (preds == 1) & (actual == 1)   # previu alta + subiu (acerto)
    mask_miss  = (preds == 1) & (actual == 0)   # previu alta + caiu  (erro)
    mask_down  = preds == 0                      # previu baixa/manter (neutro)

    fig, ax = plt.subplots(figsize=(14, 6))
    fig.patch.set_facecolor("#0f1117")
    ax.set_facecolor("#0f1117")

    # ── Linha de preço
    ax.plot(dates, closes, color="#4fc3f7", linewidth=1.6,
            label="Fechamento real", zorder=2)

    # ── Pontos: neutros
    ax.scatter(dates[mask_down], closes[mask_down],
               color="#546e7a", s=20, zorder=3, alpha=0.6, label="Previsão: Baixa/Manter")

    # ── Pontos: erros de alta
    ax.scatter(dates[mask_miss], closes[mask_miss],
               color="#ff7043", s=55, marker="^", zorder=4, alpha=0.85, label="Previsão: Alta (erro)")

    # ── Pontos: acertos de alta
    ax.scatter(dates[mask_hit], closes[mask_hit],
               color="#00e676", s=75, marker="^", zorder=5, alpha=1.0, label="Previsão: Alta (acerto)")

    # ── Formatação do gráfico
    ax.set_title(
        f"{company} — Últimos {last_n} dias | Previsões de Alta",
        color="white", fontsize=14, fontweight="bold", pad=16,
    )
    ax.set_xlabel("Data", color="#90a4ae", fontsize=10)
    ax.set_ylabel("Preço de Fechamento (USD)", color="#90a4ae", fontsize=10)
    ax.tick_params(colors="#90a4ae", labelsize=9)
    for spine in ax.spines.values():
        spine.set_color("#263238")

    # Grid sutil
    ax.grid(axis="y", color="#263238", linewidth=0.7, linestyle="--")

    # Legenda
    legend = ax.legend(
        facecolor="#1c2833", edgecolor="#546e7a",
        labelcolor="white", fontsize=9, loc="upper left",
    )

    # Estatísticas no gráfico
    hit_rate = mask_hit.sum() / (mask_hit.sum() + mask_miss.sum() + 1e-9)
    stats_text = (
        f"Acertos de Alta: {mask_hit.sum()} / {(preds==1).sum()}  "
        f"({hit_rate*100:.0f}%)"
    )
    ax.annotate(stats_text, xy=(0.02, 0.04), xycoords="axes fraction",
                color="#b0bec5", fontsize=9,
                bbox=dict(boxstyle="round,pad=0.4", fc="#263238", ec="#546e7a", alpha=0.8))

    plt.xticks(rotation=30, ha="right")
    fig.tight_layout()
    return fig


def plot_confusion_matrix(y_test, y_pred) -> plt.Figure:
    """Plota a matriz de confusão com estilo escuro."""
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(5, 4))
    fig.patch.set_facecolor("#0f1117")
    ax.set_facecolor("#0f1117")

    disp = ConfusionMatrixDisplay(cm, display_labels=["Baixa/Manter", "Alta"])
    disp.plot(ax=ax, colorbar=False, cmap="Blues")
    ax.set_title("Matriz de Confusão", color="white", fontsize=12, fontweight="bold")
    ax.tick_params(colors="#90a4ae")
    ax.xaxis.label.set_color("#90a4ae")
    ax.yaxis.label.set_color("#90a4ae")

    # Estilo do texto interno
    for text in ax.texts:
        text.set_color("white")
        text.set_fontsize(14)
        text.set_fontweight("bold")

    fig.tight_layout()
    return fig


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════

def run_pipeline(company: str = DEFAULT_COMPANY, model_type: str = "gbm",
                 save_plots: bool = True, show_plots: bool = True):
    """
    Executa o pipeline completo de ETL → Features → Modelo → Avaliação.

    Args:
        company:    ticker da empresa (ex: 'GOOGL', 'AAPL', 'MSFT')
        model_type: 'gbm' (Gradient Boosting) ou 'rf' (Random Forest)
        save_plots: salvar figuras em disco
        show_plots: exibir figuras interativamente
    """
    # ── 1. ETL
    df_clean = load_and_clean(DATA_PATH, company)

    # ── 2. Feature Engineering
    df_feat = engineer_features(df_clean)

    # ── 3. Divisão temporal + treinamento
    X_train, X_test, y_train, y_test, df_test = split_temporal(df_feat)
    model, scaler = train_model(X_train, y_train, model_type)

    # ── 4. Avaliação
    y_pred, y_prob = evaluate_model(model, scaler, X_test, y_test)

    # ── 5. Visualizações
    print(f"\n{'='*60}")
    print("  [Plots] Gerando visualizações")
    print(f"{'='*60}")

    plt.style.use("dark_background")

    fig_pred = plot_predictions(df_test, y_pred, company, last_n=100)
    fig_cm   = plot_confusion_matrix(y_test, y_pred)
    fig_imp  = plot_feature_importance(model, model_type)

    if save_plots:
        fig_pred.savefig(f"{company}_predictions.png", dpi=150, bbox_inches="tight")
        fig_cm.savefig(f"{company}_confusion_matrix.png", dpi=150, bbox_inches="tight")
        if fig_imp:
            fig_imp.savefig(f"{company}_feature_importance.png", dpi=150, bbox_inches="tight")
        print(f"  Gráficos salvos: {company}_predictions.png | {company}_confusion_matrix.png")

    if show_plots:
        plt.show()

    print(f"\n{'='*60}")
    print("  Pipeline concluído com sucesso!")
    print(f"{'='*60}\n")

    return model, scaler, df_feat


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="NeuroFinance — Predição de direção do preço de ações",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--company", type=str, default=DEFAULT_COMPANY,
        help="Ticker da empresa (ex: AAPL, MSFT, AMZN, NVDA)",
    )
    parser.add_argument(
        "--model", type=str, default="gbm", choices=["gbm", "rf"],
        help="Algoritmo: 'gbm' (Gradient Boosting) ou 'rf' (Random Forest)",
    )
    parser.add_argument(
        "--no-show", action="store_true",
        help="Não exibe os gráficos (útil em ambientes headless)",
    )
    args = parser.parse_args()

    run_pipeline(
        company=args.company,
        model_type=args.model,
        save_plots=True,
        show_plots=not args.no_show,
    )
