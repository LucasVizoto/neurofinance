'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface StructuredAnalysis {
  tipo: 'analise_estruturada'
  ticker: string
  probabilidade: number
  direcao: 'Alta' | 'Baixa/Manter'
  analise_tecnica: string
  analise_fundamentalista: string
  recomendacao: 'COMPRA' | 'VENDA' | 'AGUARDAR'
  justificativa: string
  nivel_confianca: 'Alto' | 'Médio' | 'Baixo'
}

interface AssetAnalysisCardProps {
  analysis: StructuredAnalysis
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const recomendacaoColor = (r: string): 'success' | 'error' | 'warning' => {
  if (r === 'COMPRA') return 'success'
  if (r === 'VENDA') return 'error'
  return 'warning'
}

const confiancaColor = (c: string): 'success' | 'warning' | 'error' => {
  if (c === 'Alto') return 'success'
  if (c === 'Médio') return 'warning'
  return 'error'
}

const direcaoIcon = (d: string) =>
  d === 'Alta' ? '📈' : '📉'

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const AssetAnalysisCard = ({ analysis }: AssetAnalysisCardProps) => {
  const prob = Math.round(analysis.probabilidade * 100)

  return (
    <Card
      variant='outlined'
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: analysis.recomendacao === 'COMPRA'
          ? 'success.main'
          : analysis.recomendacao === 'VENDA'
            ? 'error.main'
            : 'warning.main',
        background: 'var(--mui-palette-background-paper)',
        maxWidth: 480,
        width: '100%',
        boxShadow: 3,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='h5' fontWeight={700} color='primary'>
              {analysis.ticker}
            </Typography>
            <Typography variant='h6'>{direcaoIcon(analysis.direcao)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Chip
              label={analysis.recomendacao}
              color={recomendacaoColor(analysis.recomendacao)}
              size='small'
              sx={{ fontWeight: 700, letterSpacing: 0.5 }}
            />
            <Chip
              label={`Confiança: ${analysis.nivel_confianca}`}
              color={confiancaColor(analysis.nivel_confianca)}
              variant='outlined'
              size='small'
            />
          </Box>
        </Box>

        {/* Probabilidade */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant='caption' color='text.secondary'>
              Probabilidade de Alta
            </Typography>
            <Typography variant='caption' fontWeight={700} color={prob >= 60 ? 'success.main' : prob <= 40 ? 'error.main' : 'warning.main'}>
              {prob}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={prob}
            color={prob >= 60 ? 'success' : prob <= 40 ? 'error' : 'warning'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Análise Técnica */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant='caption' fontWeight={700} color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            📊 Análise Técnica
          </Typography>
          <Typography variant='body2' sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {analysis.analise_tecnica}
          </Typography>
        </Box>

        {/* Análise Fundamentalista */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant='caption' fontWeight={700} color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            🏦 Análise Fundamentalista
          </Typography>
          <Typography variant='body2' sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {analysis.analise_fundamentalista}
          </Typography>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Justificativa */}
        <Box>
          <Typography variant='caption' fontWeight={700} color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            💡 Justificativa
          </Typography>
          <Typography variant='body2' sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {analysis.justificativa}
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant='caption' color='text.disabled'>
            NeuroFinance AI • Análise gerada automaticamente
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AssetAnalysisCard
