import React from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';
import CodeIcon from '@mui/icons-material/Code';
import SpeedIcon from '@mui/icons-material/Speed';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Challenges CTF',
      description: 'Entraînez-vous sur des challenges variés et progressifs',
      path: '/challenges',
    },
    {
      icon: <BugReportIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Outils CTF',
      description: 'Accédez à une collection d\'outils essentiels pour vos CTF',
      path: '/tools',
    },
    {
      icon: <CodeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Environnement Intégré',
      description: 'Un environnement de développement complet pour vos CTF',
      path: '/tools',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Performance',
      description: 'Interface rapide et responsive pour une expérience optimale',
      path: '/tools',
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: '800px',
          mb: 4,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PwnBox
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Votre plateforme d'entraînement CTF tout-en-un
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/challenges')}
          sx={{
            background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
            '&:hover': {
              background: 'linear-gradient(45deg, #4cff4c, #00ff00)',
            },
          }}
        >
          Commencer l'aventure
        </Button>
      </Box>

      {/* Features Grid */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                background: 'rgba(45, 45, 45, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 255, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 4px 20px rgba(0, 255, 0, 0.1)',
                },
                cursor: 'pointer',
              }}
              onClick={() => navigate(feature.path)}
            >
              {feature.icon}
              <Typography
                variant="h6"
                component="h3"
                sx={{ mt: 2, mb: 1, fontWeight: 600 }}
              >
                {feature.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ flex: 1 }}
              >
                {feature.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Box
        sx={{
          textAlign: 'center',
          mt: 6,
          p: 4,
          borderRadius: 2,
          background: 'rgba(45, 45, 45, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 255, 0, 0.1)',
          maxWidth: '800px',
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Prêt à relever le défi ?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Rejoignez notre communauté et commencez votre voyage dans le monde des CTF
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate('/challenges')}
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              borderColor: 'primary.light',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
            },
          }}
        >
          Voir les challenges
        </Button>
      </Box>
    </Box>
  );
};

export default Home; 