import { Bloom, ColorDepth, EffectComposer, Outline, Vignette } from '@react-three/postprocessing'
import { useStore } from '../../store'

export function Post() {
  const pixel = useStore((s) => s.pixel)
  return (
    <EffectComposer multisampling={0}>
      <Outline blur edgeStrength={6} visibleEdgeColor={0xffe0b0} hiddenEdgeColor={0xffe0b0} />
      <Bloom mipmapBlur luminanceThreshold={0.8} intensity={0.9} />
      {/* limited palette in pixel mode; 24 bits = effectively off */}
      <ColorDepth bits={pixel ? 18 : 24} />
      <Vignette offset={0.3} darkness={0.6} />
    </EffectComposer>
  )
}
