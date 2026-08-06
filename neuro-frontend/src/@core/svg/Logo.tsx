// React Imports
import type { SVGAttributes } from 'react'

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='1.25em' height='1.25em' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      
      {/* 
        ========================================================================
        HEMISFÉRIO ESQUERDO: CONTORNO DO CÉREBRO (Muda de cor com a fonte)
        ========================================================================
      */}
      <path
        d='M 48 15 C 38 10, 25 15, 15 30 C 10 40, 10 55, 15 65 C 22 78, 35 85, 48 85 V 81 C 38 81, 27 75, 21 63 C 15 53, 15 42, 20 32 C 28 20, 38 19, 48 19 Z'
        fill='currentColor'
      />

      {/* DETALHES DOS CIRCUITOS (Linhas e Pontos) - Ajustados para não ficarem espaçados */}
      <g stroke='currentColor' strokeWidth='1.5' fill='none'>
        <path d='M 48 25 H 35 L 28 32 V 42 H 22' />
        <path d='M 48 40 H 42 L 35 47 V 55 H 28' />
        <path d='M 48 55 H 45 L 38 62 V 70 H 30' />
        <path d='M 48 70 H 42 L 35 77' />
        <path d='M 48 32 H 42 L 35 25 H 25' />
      </g>
      <g fill='currentColor'>
        <circle cx='22' cy='42' r='2' />
        <circle cx='28' cy='55' r='2' />
        <circle cx='30' cy='70' r='2' />
        <circle cx='35' cy='77' r='2' />
        <circle cx='25' cy='25' r='2' />
      </g>

      {/* 
        ========================================================================
        HEMISFÉRIO DIREITO: NUVEM/SÓLIDO BÁSICO (Muda de cor com a fonte)
        Inicia colado no centro (x=52), mantendo apenas uma fresta do lado esquerdo (x=48)
        ========================================================================
      */}
      <path
        d='M 52 15 C 65 10, 80 15, 85 32 L 70 57 L 60 42 L 52 52 Z'
        fill='currentColor'
      />
      {/* Realce (Brilho Prateado) mantendo a lógica de código solicitada */}
      <path
        d='M 52 15 C 60 12, 65 15, 70 22 L 55 42 L 52 40 Z'
        fill='white'
        fillOpacity='0.2'
      />

      {/* 
        ========================================================================
        GRÁFICO DE BARRAS / CANDLESTICKS 
        Hastes e corpos conectados perfeitamente próximos à linha verde
        ========================================================================
      */}
      <g stroke='currentColor' strokeWidth='1' fill='currentColor'>
        <line x1='56' y1='52' x2='56' y2='70' />
        <rect x='54' y='55' width='4' height='10' />
        
        <line x1='62' y1='48' x2='62' y2='72' />
        <rect x='60' y='53' width='4' height='14' />
        
        <line x1='68' y1='58' x2='68' y2='82' />
        <rect x='66' y='63' width='4' height='12' />
        
        <line x1='74' y1='50' x2='74' y2='75' />
        <rect x='72' y='55' width='4' height='14' />
        
        <line x1='80' y1='38' x2='80' y2='60' />
        <rect x='78' y='42' width='4' height='12' />
      </g>
      
      {/* Reflexo / Brilho nas Barras */}
      <g fill='white' fillOpacity='0.2'>
        <rect x='54' y='55' width='2' height='10' />
        <rect x='60' y='53' width='2' height='14' />
        <rect x='66' y='63' width='2' height='12' />
        <rect x='72' y='55' width='2' height='14' />
        <rect x='78' y='42' width='2' height='12' />
      </g>

      {/* 
        ========================================================================
        LINHA DE TENDÊNCIA E SETA VERDE (Cores fixas para a identidade visual)
        ========================================================================
      */}
      <path
        d='M 52 52 L 60 42 L 70 57 L 90 24'
        stroke='#3CB371'
        strokeWidth='3'
        fill='none'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <polygon points='82,25 91,22 87,13' fill='#3CB371' />

      {/* 
        ========================================================================
        SÍMBOLO DO CIFRÃO ($)
        Usando cor escura/azul fixo para contrastar bem com a estrutura mutável
        ========================================================================
      */}
      <path
        d='M68,22 v2 c1.5,0.5 2.5,1.5 2.5,3 h-2 c0,-1 -1,-1.5 -2,-1.5 c-1.5,0 -2,0.5 -2,1.5 c0,1 1.5,1.5 3.5,2.5 c2,1 2.5,2.5 2.5,4.5 c0,2 -1.5,3.5 -3.5,4 v2 h-2 v-2 c-2,-0.5 -3,-2 -3,-3.5 h2 c0,1 1,2 2,2 c1.5,0 2.5,-1 2.5,-2 c0,-1 -1,-2 -3.5,-3 c-2,-1 -2.5,-2.5 -2.5,-4 c0,-2 1.5,-3 3,-3.5 v-2 h2 z'
        fill='#0B192C'
      />
      
    </svg>
  )
}

export default Logo