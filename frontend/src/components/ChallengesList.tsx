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
  DialogContentText,
  Link,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FlagIcon from '@mui/icons-material/Flag';
import axios, { AxiosError } from 'axios';

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  solved: boolean;
  resources?: {
    links?: string[];
    commands?: string[];
    files?: string[];
  };
  created_at: string;
  updated_at: string;
}

const ChallengesList = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [open, setOpen] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    resources: {
      links: [],
      commands: [],
      files: [],
    },
  });
  const [openEdit, setOpenEdit] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deletingChallengeId, setDeletingChallengeId] = useState<number | null>(null);

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

  const handleViewOpen = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setOpenView(true);
  };

  const handleViewClose = () => {
    setSelectedChallenge(null);
    setOpenView(false);
  };

  const handleEditOpen = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setOpenEdit(true);
  };

  const handleEditClose = () => {
    setEditingChallenge(null);
    setOpenEdit(false);
  };

  const handleDeleteOpen = (id: number) => {
    setDeletingChallengeId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => {
    setDeletingChallengeId(null);
    setOpenDelete(false);
  };

  const validateChallenge = () => {
    if (!newChallenge.title.trim()) {
      setError('Le titre est requis');
      return false;
    }
    if (!newChallenge.description.trim()) {
      setError('La description est requise');
      return false;
    }
    if (!newChallenge.category) {
      setError('La catégorie est requise');
      return false;
    }
    if (!newChallenge.difficulty) {
      setError('La difficulté est requise');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateChallenge()) {
      return;
    }

    try {
      // Nettoyer les données avant l'envoi
      const challengeData = {
        title: newChallenge.title.trim(),
        description: newChallenge.description.trim(),
        category: newChallenge.category,
        difficulty: newChallenge.difficulty,
        resources: newChallenge.resources || {}
      };

      console.log('Données envoyées:', challengeData);
      const response = await axios.post('http://localhost:8000/challenges/', challengeData);
      console.log('Réponse du serveur:', response.data);
      
      handleClose();
      fetchChallenges();
      setNewChallenge({
        title: '',
        description: '',
        category: '',
        difficulty: '',
        resources: {
          links: [],
          commands: [],
          files: [],
        },
      });
      setError(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du challenge:', error);
      if (error instanceof AxiosError && error.response) {
        setError(error.response.data.detail || 'Une erreur est survenue lors de la création du challenge');
      } else {
        setError('Une erreur est survenue lors de la création du challenge');
      }
    }
  };

  const handleEditSubmit = async () => {
    if (!editingChallenge) return;

    try {
      const challengeData = {
        title: editingChallenge.title.trim(),
        description: editingChallenge.description.trim(),
        category: editingChallenge.category,
        difficulty: editingChallenge.difficulty,
        resources: editingChallenge.resources || {}
      };

      await axios.put(`http://localhost:8000/challenges/${editingChallenge.id}`, challengeData);
      handleEditClose();
      fetchChallenges();
    } catch (error) {
      console.error('Erreur lors de la modification du challenge:', error);
      if (error instanceof AxiosError && error.response) {
        setError(error.response.data.detail || 'Une erreur est survenue lors de la modification du challenge');
      } else {
        setError('Une erreur est survenue lors de la modification du challenge');
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingChallengeId) return;

    try {
      await axios.delete(`http://localhost:8000/challenges/${deletingChallengeId}`);
      handleDeleteClose();
      fetchChallenges();
    } catch (error) {
      console.error('Erreur lors de la suppression du challenge:', error);
      if (error instanceof AxiosError && error.response) {
        setError(error.response.data.detail || 'Une erreur est survenue lors de la suppression du challenge');
      } else {
        setError('Une erreur est survenue lors de la suppression du challenge');
      }
    }
  };

  const handleToggleSolved = async (challenge: Challenge) => {
    try {
      const response = await axios.patch(`http://localhost:8000/challenges/${challenge.id}/toggle-solved`);
      // Mettre à jour l'état local
      if (selectedChallenge && selectedChallenge.id === challenge.id) {
        setSelectedChallenge(response.data);
      }
      fetchChallenges();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du challenge:', error);
      if (error instanceof AxiosError && error.response) {
        setError(error.response.data.detail || 'Une erreur est survenue lors de la mise à jour du statut');
      } else {
        setError('Une erreur est survenue lors de la mise à jour du statut');
      }
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

  const totalChallenges = challenges.length;
  const solvedChallenges = challenges.filter(challenge => challenge.solved).length;
  const progress = totalChallenges > 0 ? (solvedChallenges / totalChallenges) * 100 : 0;

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
            Progression: {solvedChallenges}/{totalChallenges} challenges résolus
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
              <TableCell>Titre</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Difficulté</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {challenges.map((challenge) => (
              <TableRow 
                key={challenge.id} 
                hover 
                onClick={() => handleViewOpen(challenge)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{challenge.title}</TableCell>
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
                <TableCell>
                  <Chip
                    icon={<FlagIcon />}
                    label={challenge.solved ? 'Résolu' : 'Non résolu'}
                    color={challenge.solved ? 'success' : 'default'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSolved(challenge);
                    }}
                    sx={{
                      background: challenge.solved 
                        ? 'rgba(0, 255, 0, 0.1)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: challenge.solved ? '#00ff00' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Modifier">
                    <IconButton 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(challenge);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton 
                      color="error" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOpen(challenge.id);
                      }}
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

      {/* Dialog pour voir les détails du challenge */}
      <Dialog
        open={openView}
        onClose={handleViewClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#2d2d2d',
            border: '1px solid rgba(0, 255, 0, 0.1)',
          }
        }}
      >
        {selectedChallenge && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">{selectedChallenge.title}</Typography>
                <Chip
                  icon={<FlagIcon />}
                  label={selectedChallenge.solved ? 'Résolu' : 'Non résolu'}
                  color={selectedChallenge.solved ? 'success' : 'default'}
                  onClick={() => handleToggleSolved(selectedChallenge)}
                  sx={{
                    background: selectedChallenge.solved 
                      ? 'rgba(0, 255, 0, 0.1)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: selectedChallenge.solved ? '#00ff00' : '#ffffff',
                    cursor: 'pointer',
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedChallenge.description}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Informations
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Chip 
                      label={selectedChallenge.category} 
                      color="primary" 
                      sx={{ 
                        background: 'rgba(0, 255, 0, 0.1)',
                        color: '#00ff00',
                      }}
                    />
                    <Chip 
                      label={selectedChallenge.difficulty}
                      sx={{
                        background: `rgba(${getDifficultyColor(selectedChallenge.difficulty)}, 0.1)`,
                        color: getDifficultyColor(selectedChallenge.difficulty),
                        fontWeight: 'bold',
                      }}
                    />
                  </Stack>
                </Box>

                {selectedChallenge.resources && (
                  <>
                    {selectedChallenge.resources.links && selectedChallenge.resources.links.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          Liens utiles
                        </Typography>
                        <Stack spacing={1}>
                          {selectedChallenge.resources.links.map((link, index) => (
                            <Link 
                              key={index} 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              sx={{ color: 'primary.main' }}
                            >
                              {link}
                            </Link>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {selectedChallenge.resources.commands && selectedChallenge.resources.commands.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          Commandes utiles
                        </Typography>
                        <Stack spacing={1}>
                          {selectedChallenge.resources.commands.map((command, index) => (
                            <Typography
                              key={index}
                              sx={{
                                fontFamily: 'monospace',
                                color: '#00ff00',
                                background: 'rgba(0, 255, 0, 0.1)',
                                padding: '8px 12px',
                                borderRadius: '4px',
                              }}
                            >
                              {command}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {selectedChallenge.resources.files && selectedChallenge.resources.files.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          Fichiers
                        </Typography>
                        <Stack spacing={1}>
                          {selectedChallenge.resources.files.map((file, index) => (
                            <Button
                              key={index}
                              variant="outlined"
                              size="small"
                              href={file}
                              target="_blank"
                              sx={{
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                  borderColor: 'primary.light',
                                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                },
                              }}
                            >
                              Télécharger le fichier
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleViewClose}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog pour ajouter un challenge */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#2d2d2d',
            border: '1px solid rgba(0, 255, 0, 0.1)',
          }
        }}
      >
        <DialogTitle>Ajouter un nouveau challenge</DialogTitle>
        <DialogContent>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Titre"
              value={newChallenge.title}
              onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
              fullWidth
              required
              error={error === 'Le titre est requis'}
            />
            <TextField
              label="Description"
              value={newChallenge.description}
              onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
              fullWidth
              multiline
              rows={4}
              required
              error={error === 'La description est requise'}
            />
            <TextField
              select
              label="Catégorie"
              value={newChallenge.category}
              onChange={(e) => setNewChallenge({ ...newChallenge, category: e.target.value })}
              fullWidth
              required
              error={error === 'La catégorie est requise'}
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
              required
              error={error === 'La difficulté est requise'}
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

      {/* Dialog pour modifier un challenge */}
      <Dialog 
        open={openEdit} 
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#2d2d2d',
            border: '1px solid rgba(0, 255, 0, 0.1)',
          }
        }}
      >
        {editingChallenge && (
          <>
            <DialogTitle>Modifier le challenge</DialogTitle>
            <DialogContent>
              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Titre"
                  value={editingChallenge.title}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  value={editingChallenge.description}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={4}
                  required
                />
                <TextField
                  select
                  label="Catégorie"
                  value={editingChallenge.category}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, category: e.target.value })}
                  fullWidth
                  required
                  SelectProps={{
                    native: true,
                  }}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Difficulté"
                  value={editingChallenge.difficulty}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, difficulty: e.target.value })}
                  fullWidth
                  required
                  SelectProps={{
                    native: true,
                  }}
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </TextField>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose}>Annuler</Button>
              <Button 
                onClick={handleEditSubmit} 
                variant="contained"
                sx={{
                  background: 'linear-gradient(45deg, #00ff00, #4cff4c)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #4cff4c, #00ff00)',
                  },
                }}
              >
                Modifier
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={openDelete}
        onClose={handleDeleteClose}
        PaperProps={{
          sx: {
            background: '#2d2d2d',
            border: '1px solid rgba(255, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce challenge ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Annuler</Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengesList; 