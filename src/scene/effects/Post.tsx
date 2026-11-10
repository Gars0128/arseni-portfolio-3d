import { Bloom, EffectComposer, Outline, SMAA, SSAO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'

// The composer disables renderer tone mapping, so it has to be an effect here.
// shortcut: SSAO instead of N8AO — the N8AO bundled with @react-three/postprocessing 3.2 crashes on three r187; revisit when it updates.
export function Post() {
  return (
    <EffectComposer multisampling={0} enableNormalPass autoClear={false}>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}
        rings={4}
        radius={0.1}
        intensity={18}
        luminanceInfluence={0.6}
        worldDistanceThreshold={1}
        worldDistanceFalloff={0.3}
        worldProximityThreshold={0.4}
        worldProximityFalloff={0.25}
      />
      <Outline blur edgeStrength={3} visibleEdgeColor={0xfff0d8} hiddenEdgeColor={0xfff0d8} />
      <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.3} intensity={0.8} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
      <Vignette offset={0.35} darkness={0.45} />
    </EffectComposer>
  )
}
