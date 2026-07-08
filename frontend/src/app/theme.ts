import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const CustomPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: 'var(--color-amber-300)',
            100: 'var(--color-amber-400)',
            200: 'var(--color-amber-500)',
            300: 'var(--color-amber-600)',
            400: 'var(--color-amber-700)',
            500: 'var(--color-amber-800)',
            600: 'var(--color-amber-900)',
            700: 'var(--color-amber-950)',
            800: 'var(--color-amber-950)',
            900: 'var(--color-amber-950)',
            950: 'var(--color-amber-950)'
        }
    },
    components: {
        button: {
            root: {
                primary: {
                    color: "var(--color-zinc-100)",
                    hoverColor: "var(--color-zinc-300)",
                    activeColor: "var(--color-zinc-300)",
                },
                secondary: {
                    color: "white",
                    borderColor: "var(--color-zinc-600)",
                    background: "var(--color-zinc-800)"
                },
            }
        }
    }
});

export default CustomPreset;