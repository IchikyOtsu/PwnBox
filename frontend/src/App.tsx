import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Container } from '@mui/material';
import theme from './theme';
import Navbar from './components/Navbar';
import ToolsList from './components/ToolsList';
import ChallengesList from './components/ChallengesList';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at center, rgba(0, 255, 0, 0.1) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
            zIndex: 0,
          },
          '@keyframes pulse': {
            '0%': {
              opacity: 0.5,
              transform: 'scale(1)',
            },
            '50%': {
              opacity: 0.8,
              transform: 'scale(1.05)',
            },
            '100%': {
              opacity: 0.5,
              transform: 'scale(1)',
            },
          },
        }}
      >
        <Router>
          <Navbar />
          <Container 
            maxWidth={false}
            sx={{ 
              flex: 1,
              py: 4,
              px: { xs: 2, sm: 3, md: 4 },
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Routes>
              <Route path="/" element={<ToolsList />} />
              <Route path="/challenges" element={<ChallengesList />} />
            </Routes>
          </Container>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
