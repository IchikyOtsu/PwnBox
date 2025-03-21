import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FlagIcon from '@mui/icons-material/Flag';
import axios from 'axios';

interface Challenge {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  flag: string;
  points: number;
  solved: boolean;
}

const ChallengesList = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [open, setOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    name: '',
    description: '',
    category: '',
    difficulty: '',
    flag: '',
    points: 0,
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await axios.get('http://localhost:8000/challenges/');
      setChallenges(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des challenges:', error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:8000/challenges/', newChallenge);
      handleClose();
      fetchChallenges();
      setNewChallenge({
        name: '',
        description: '',
        category: '',
        difficulty: '',
        flag: '',
        points: 0,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du challenge:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/challenges/${id}`);
      fetchChallenges();
    } catch (error) {
      console.error('Erreur lors de la suppression du challenge:', error);
    }
  };

  const categories = ['Web', 'Pwn', 'Crypto', 'Forensics', 'Misc'];
  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#00ff00';
      case 'medium':
        return '#ffff00';
      case 'hard':
        return '#ff9900';
      case 'expert':
        return '#ff0000';
      default:
        return '#ffffff';
    }
  };

  const totalPoints = challenges.reduce((sum, challenge) => sum + challenge.points, 0);
  const solvedPoints = challenges
    .filter(challenge => challenge.solved)
    .reduce((sum, challenge) => sum + challenge.points, 0);
  const progress = (solvedPoints / totalPoints) * 100;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Challenges CTF
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{
            background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
            '&:hover': {
              background: 'linear-gradient(45deg, #4cff4c, #00ff00)',
            },
          }}
        >
          Ajouter un challenge
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1">
            Progression: {solvedPoints}/{totalPoints} points
          </Typography>
          <Typography variant="body1">
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
            },
          }}
        />
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          background: 'rgba(45, 45, 45, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 255, 0, 0.1)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Difficulté</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {challenges.map((challenge) => (
              <TableRow key={challenge.id}>
                <TableCell>{challenge.name}</TableCell>
                <TableCell>{challenge.description}</TableCell>
                <TableCell>
                  <Chip 
                    label={challenge.category} 
                    color="primary" 
                    sx={{ 
                      background: 'rgba(0, 255, 0, 0.1)',
                      color: '#00ff00',
                      '&:hover': {
                        background: 'rgba(0, 255, 0, 0.2)',
                      },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={challenge.difficulty}
                    sx={{
                      background: `rgba(${getDifficultyColor(challenge.difficulty)}, 0.1)`,
                      color: getDifficultyColor(challenge.difficulty),
                      fontWeight: 'bold',
                    }}
                  />
                </TableCell>
                <TableCell>{challenge.points}</TableCell>
                <TableCell>
                  <Chip
                    icon={<FlagIcon />}
                    label={challenge.solved ? 'Résolu' : 'Non résolu'}
                    color={challenge.solved ? 'success' : 'default'}
                    sx={{
                      background: challenge.solved 
                        ? 'rgba(0, 255, 0, 0.1)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: challenge.solved ? '#00ff00' : '#ffffff',
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Modifier">
                    <IconButton color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(challenge.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: {
            background: '#2d2d2d',
            border: '1px solid rgba(0, 255, 0, 0.1)',
          }
        }}
      >
        <DialogTitle>Ajouter un nouveau challenge</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nom"
              value={newChallenge.name}
              onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={newChallenge.description}
              onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              select
              label="Catégorie"
              value={newChallenge.category}
              onChange={(e) => setNewChallenge({ ...newChallenge, category: e.target.value })}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </TextField>
            <TextField
              select
              label="Difficulté"
              value={newChallenge.difficulty}
              onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Sélectionner une difficulté</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </TextField>
            <TextField
              label="Points"
              type="number"
              value={newChallenge.points}
              onChange={(e) => setNewChallenge({ ...newChallenge, points: parseInt(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Flag"
              value={newChallenge.flag}
              onChange={(e) => setNewChallenge({ ...newChallenge, flag: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
              '&:hover': {
                background: 'linear-gradient(45deg, #4cff4c, #00ff00)',
              },
            }}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengesList; 