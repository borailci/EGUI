import { Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Theme {
        // Add any custom theme properties here
    }
    interface ThemeOptions {
        // Add any custom theme options here
    }
}

export const theme: Theme; 