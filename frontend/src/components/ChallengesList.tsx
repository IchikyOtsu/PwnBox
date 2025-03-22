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
import SortIcon from '@mui/icons-material/Sort';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import axios, { AxiosError } from 'axios';

interface FileResource {
  filename: string;
  original_name: string;
}

interface ChallengeResources {
  files?: FileResource[];
  links?: string[];
  commands?: string[];
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  solved: boolean;
  correct_flag?: string;
  resources?: ChallengeResources;
  created_at: string;
  updated_at: string;
}

type SortField = 'title' | 'category' | 'difficulty' | 'created_at' | 'solved';
type SortDirection = 'asc' | 'desc';

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
    correct_flag: '',
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
  const [flagInput, setFlagInput] = useState('');
  const [flagError, setFlagError] = useState<string | null>(null);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
      const challengeData = {
        title: newChallenge.title.trim(),
        description: newChallenge.description.trim(),
        category: newChallenge.category,
        difficulty: newChallenge.difficulty,
        correct_flag: newChallenge.correct_flag.trim(),
        resources: {
          files: [],
          links: [],
          commands: []
        }
      };

      console.log('Données envoyées:', challengeData);
      const response = await axios.post('http://localhost:8000/challenges/', challengeData);
      console.log('Réponse du serveur:', response.data);
      
      // Upload des fichiers en attente
      if (pendingFiles.length > 0) {
        const updatedChallenge = { ...response.data };
        const uploadPromises = pendingFiles.map(async (file) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            const fileResponse = await axios.post(
              `http://localhost:8000/challenges/${response.data.id}/files`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );
            console.log('Fichier uploadé avec succès:', fileResponse.data);
            return fileResponse.data;
          } catch (error) {
            console.error('Erreur lors de l\'upload du fichier:', error);
            if (error instanceof AxiosError && error.response) {
              throw new Error(error.response.data.detail || 'Erreur lors de l\'upload du fichier');
            }
            throw error;
          }
        });

        try {
          const uploadedFiles = await Promise.all(uploadPromises);
          // Mettre à jour les ressources avec les fichiers uploadés
          updatedChallenge.resources.files = uploadedFiles;
          
          // Mettre à jour le challenge dans la base de données
          await axios.put(`http://localhost:8000/challenges/${response.data.id}`, updatedChallenge);
          
          // Mettre à jour l'état local
          setChallenges(prevChallenges => [...prevChallenges, updatedChallenge]);
          setPendingFiles([]); // Réinitialiser les fichiers en attente
        } catch (error) {
          console.error('Erreur lors de l\'upload des fichiers:', error);
          setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'upload des fichiers');
          // Supprimer le challenge si l'upload des fichiers échoue
          await axios.delete(`http://localhost:8000/challenges/${response.data.id}`);
          return;
        }
      } else {
        setChallenges(prevChallenges => [...prevChallenges, response.data]);
      }

      handleClose();
      setNewChallenge({
        title: '',
        description: '',
        category: '',
        difficulty: '',
        correct_flag: '',
        resources: {
          links: [],
          commands: [],
          files: [],
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création du challenge:', error);
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
        correct_flag: editingChallenge.correct_flag?.trim(),
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

  const handleFlagSubmit = async (challengeId: number) => {
    try {
      const response = await axios.post(`http://localhost:8000/challenges/${challengeId}/check-flag`, {
        flag: flagInput
      });
      
      if (response.data.status === 'success') {
        setFlagSuccess(true);
        setFlagError(null);
      } else {
        setFlagSuccess(false);
        setFlagError('Flag incorrect');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du flag:', error);
      setFlagError('Une erreur est survenue lors de la vérification du flag');
    }
  };

  const handleFileUpload = async (challengeId: number | null, file: File) => {
    if (!challengeId) {
      // Si pas d'ID, c'est un nouveau challenge, on stocke le fichier en attente
      setPendingFiles(prev => [...prev, file]);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`http://localhost:8000/challenges/${challengeId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Mettre à jour l'état local
      if (editingChallenge && editingChallenge.id === challengeId) {
        setEditingChallenge({
          ...editingChallenge,
          resources: {
            ...editingChallenge.resources,
            files: [...(editingChallenge.resources?.files || []), response.data]
          }
        });
      }
      
      // Mettre à jour la liste des challenges
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => {
          if (challenge.id === challengeId) {
            return {
              ...challenge,
              resources: {
                ...challenge.resources,
                files: [...(challenge.resources?.files || []), response.data]
              }
            };
          }
          return challenge;
        })
      );
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      if (error instanceof AxiosError && error.response) {
        setError(error.response.data.detail || 'Une erreur est survenue lors de l\'upload du fichier');
      } else {
        setError('Une erreur est survenue lors de l\'upload du fichier');
      }
    }
  };

  const handleFileDelete = async (challengeId: number, filename: string) => {
    try {
      await axios.delete(`http://localhost:8000/challenges/${challengeId}/files/${filename}`);
      
      // Mettre à jour l'état local
      if (editingChallenge && editingChallenge.id === challengeId) {
        setEditingChallenge({
          ...editingChallenge,
          resources: {
            ...editingChallenge.resources,
            files: editingChallenge.resources?.files?.filter(file => file.filename !== filename) || []
          }
        });
      }
      fetchChallenges();
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      if (error instanceof AxiosError && error.response) {
        setError(error.response.data.detail || 'Une erreur est survenue lors de la suppression du fichier');
      } else {
        setError('Une erreur est survenue lors de la suppression du fichier');
      }
    }
  };

  const handleFileDownload = async (challengeId: number, filename: string, originalName: string) => {
    try {
      console.log(`Tentative de téléchargement du fichier ${filename} pour le challenge ${challengeId}`);
      const response = await axios.get(
        `http://localhost:8000/challenges/${challengeId}/files/${filename}`,
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'application/octet-stream'
          }
        }
      );
      
      // Vérifier si la réponse est un blob
      if (!(response.data instanceof Blob)) {
        throw new Error('La réponse n\'est pas un blob');
      }
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(response.data);
      
      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      
      // Ajouter le lien au document et cliquer dessus
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Téléchargement terminé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      if (error instanceof AxiosError && error.response) {
        // Si c'est une erreur Axios, essayer de lire le message d'erreur du blob
        if (error.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorMessage = JSON.parse(reader.result as string);
              setError(errorMessage.detail || 'Une erreur est survenue lors du téléchargement du fichier');
            } catch (e) {
              setError('Une erreur est survenue lors du téléchargement du fichier');
            }
          };
          reader.readAsText(error.response.data);
        } else {
          setError(error.response.data.detail || 'Une erreur est survenue lors du téléchargement du fichier');
        }
      } else {
        setError('Une erreur est survenue lors du téléchargement du fichier');
      }
      
      // Rafraîchir la liste des challenges pour s'assurer que les données sont à jour
      fetchChallenges();
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setSortField('created_at');
    setSortDirection('desc');
  };

  const sortedChallenges = [...challenges].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'difficulty':
        comparison = a.difficulty.localeCompare(b.difficulty);
        break;
      case 'created_at':
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        break;
      case 'solved':
        comparison = (a.solved === b.solved) ? 0 : (a.solved ? 1 : -1);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Challenges CTF
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetFilters}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.light',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
              },
            }}
          >
            Réinitialiser les filtres
          </Button>
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
              <TableCell 
                onClick={() => handleSort('title')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Titre
                  {sortField === 'title' && (
                    <SortByAlphaIcon sx={{ 
                      transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                      color: 'primary.main'
                    }} />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('category')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Catégorie
                  {sortField === 'category' && (
                    <SortByAlphaIcon sx={{ 
                      transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                      color: 'primary.main'
                    }} />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('difficulty')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Difficulté
                  {sortField === 'difficulty' && (
                    <SortByAlphaIcon sx={{ 
                      transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                      color: 'primary.main'
                    }} />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('created_at')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Date de création
                  {sortField === 'created_at' && (
                    <SortIcon sx={{ 
                      transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                      color: 'primary.main'
                    }} />
                  )}
                </Box>
              </TableCell>
              <TableCell 
                onClick={() => handleSort('solved')}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Statut
                  {sortField === 'solved' && (
                    <SortIcon sx={{ 
                      transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                      color: 'primary.main'
                    }} />
                  )}
                </Box>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedChallenges.map((challenge) => (
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
                  {new Date(challenge.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
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
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'rgba(0, 255, 0, 0.1)',
                              }}
                            >
                              <Typography sx={{ flex: 1 }}>{file.original_name}</Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleFileDownload(selectedChallenge.id, file.filename, file.original_name)}
                                sx={{
                                  borderColor: 'primary.main',
                                  color: 'primary.main',
                                  '&:hover': {
                                    borderColor: 'primary.light',
                                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                  },
                                }}
                              >
                                Télécharger
                              </Button>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </>
                )}

                {/* Section Flag */}
                {!selectedChallenge.solved && (
                  <Box>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Vérifier le flag
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Entrez le flag"
                        value={flagInput}
                        onChange={(e) => {
                          setFlagInput(e.target.value);
                          setFlagError(null);
                          setFlagSuccess(false);
                        }}
                        error={!!flagError}
                        helperText={flagError}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: flagSuccess ? 'success.main' : undefined,
                            },
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleFlagSubmit(selectedChallenge.id)}
                        disabled={!flagInput}
                        sx={{
                          background: flagSuccess 
                            ? 'success.main'
                            : 'linear-gradient(45deg, #00ff00, #4cff4c)',
                          '&:hover': {
                            background: flagSuccess 
                              ? 'success.dark'
                              : 'linear-gradient(45deg, #4cff4c, #00ff00)',
                          },
                        }}
                      >
                        {flagSuccess ? 'Validé' : 'Vérifier'}
                      </Button>
                    </Box>
                  </Box>
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
            <TextField
              label="Flag Correct"
              value={newChallenge.correct_flag}
              onChange={(e) => setNewChallenge({ ...newChallenge, correct_flag: e.target.value })}
              fullWidth
              helperText="Flag correct pour la validation"
            />
            <Box>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Fichiers
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.light',
                      backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    },
                  }}
                >
                  Ajouter un fichier
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(null, e.target.files[0]);
                      }
                    }}
                  />
                </Button>
              </Box>
              {pendingFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Fichiers en attente
                  </Typography>
                  <Stack spacing={1}>
                    {pendingFiles.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: 'rgba(0, 255, 0, 0.1)',
                        }}
                      >
                        <Typography sx={{ flex: 1 }}>{file.name}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setPendingFiles(pendingFiles.filter((_, i) => i !== index));
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
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
        {editingChallenge !== null && editingChallenge !== undefined && (
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
                <TextField
                  label="Flag Correct"
                  value={editingChallenge.correct_flag || ''}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, correct_flag: e.target.value })}
                  fullWidth
                  helperText="Flag correct pour la validation"
                />
                <Box>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Fichiers
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.light',
                          backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        },
                      }}
                    >
                      Ajouter un fichier
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(editingChallenge.id, e.target.files[0]);
                          }
                        }}
                      />
                    </Button>
                  </Box>
                  {editingChallenge.resources?.files && editingChallenge.resources.files.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Fichiers existants
                      </Typography>
                      <Stack spacing={1}>
                        {editingChallenge.resources.files.map((file, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1,
                              borderRadius: 1,
                              bgcolor: 'rgba(0, 255, 0, 0.1)',
                            }}
                          >
                            <Typography sx={{ flex: 1 }}>{file.original_name}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleFileDownload(editingChallenge.id, file.filename, file.original_name)}
                              sx={{ color: 'primary.main' }}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleFileDelete(editingChallenge.id, file.filename)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
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