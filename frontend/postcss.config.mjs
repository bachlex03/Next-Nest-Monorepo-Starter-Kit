import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcssPresetEnv from 'postcss-preset-env'

const plugins = [
  '@tailwindcss/postcss',
  autoprefixer,
  postcssPresetEnv({
    stage: 3,
    features: {
      'nesting-rules': true,
      'custom-properties': true,
      'custom-media-queries': true,
      'logical-properties-and-values': true,
    },
  }),
]

if (process.env.NODE_ENV === 'production') {
  plugins.push(cssnano({ preset: 'default' }))
}

const config = {
  plugins,
}

export default config
