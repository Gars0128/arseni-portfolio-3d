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
        radius={0.08}
        intensity={22}
        luminanceInfluence={0.5}
        worldDistanceThreshold={1}
        worldDistanceFalloff={0.3}
        worldProximityThreshold={0.4}
        worldProximityFalloff={0.2}
        color={undefined}
      />
      <Outline blur edgeStrength={4} visibleEdgeColor={0xffe0b0} hiddenEdgeColor={0xffe0b0} />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.3} intensity={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
      <Vignette offset={0.35} darkness={0.5} />
    </EffectComposer>
  )
}
