import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';

const Navbar = () => {
  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'rgba(26, 26, 26, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 255, 0, 0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          component={RouterLink}
          to="/"
          sx={{ mr: 2 }}
        >
          <SecurityIcon sx={{ color: 'primary.main' }} />
        </IconButton>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 700,
            background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PwnBox
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<BugReportIcon />}
            sx={{
              '&:hover': {
                background: 'rgba(0, 255, 0, 0.1)',
              },
            }}
          >
            Outils
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/challenges"
            startIcon={<SecurityIcon />}
            sx={{
              '&:hover': {
                background: 'rgba(0, 255, 0, 0.1)',
              },
            }}
          >
            Challenges
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 