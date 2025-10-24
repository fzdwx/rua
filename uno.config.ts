import {defineConfig, presetIcons, presetUno} from 'unocss'

export default defineConfig({
    presets: [
        presetUno(),
        presetIcons({
            scale: 1.2,
            warn: true,
        }),
    ],
    shortcuts: {
        'flex-center': 'flex items-center justify-center',
        'flex-col-center': 'flex flex-col items-center justify-center',
    },
    theme: {
        colors: {
            'primary': '#6ee7b7',
            'empty': 'transparent',
            'hover': '#0000000C',
            'hover2': '#00000019',
        }
    }
})
