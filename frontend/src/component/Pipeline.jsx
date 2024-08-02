import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Select, MenuItem, Button, Paper, Alert, LinearProgress, IconButton } from '@mui/material';
import NavBar from './NavBar';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import ProcessedResult from './ProcessedResult';
import PIWASUpload from './PIWASUpload';
import PIEUpload from './PIEUpload';
import { Link as RouterLink } from 'react-router-dom';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const defaultFiles = {
  caseSample: {
    'AD001-FU4': 'AD311-FU4',
    'AD002-FU4': 'AD015-FU4',
    'AD003-FU4': 'AD033-FU4',
    'AD004-FU4': 'AD055-FU4',
    'AD006-FU4': 'AD012-FU4',
    'AD007-FU4': 'AD043-FU4',
    'AD011-FU4': 'AD308-FU4',
    'AD016-FU4': 'AD005-FU4',
    'AD022-FU4': 'AD024-FU4',
    // 'AD028-FU4': 'AD037-FU4', 028 not provide
    'AD035-FU4': 'AD056-FU4',
    'AD042-FU4': 'AD301-FU4',
    'AD044-FU4': 'AD079-FU4',
    'AD053-FU4': 'AD025-FU4',
    'AD058-FU4': 'AD021-FU4',
    'AD077-FU4': 'AD013-FU4',
    'AD302-FU4': 'AD067-FU4',
    // 'AD303-FU4': 'AD031-FU4', 031 not provide
    'AD304-FU4': 'AD051-FU4',
    'AD306-FU4': 'AD040-FU4',
    'AD309-FU4': 'AD059-FU4',
    'AD312-FU4': 'AD072-FU4',
    'AD313-FU4': 'AD073-FU4',
    'AD315-FU4': 'AD052-FU4',
    'AD316-FU4': 'AD054-FU4',
    'AD318-FU4': 'AD325-FU4',
    'AD319-FU4': 'AD046-FU4',
    'AD320-FU4': 'AD029-FU4',
    'AD322-FU4': 'AD321-FU4',
    'AD323-FU4': 'AD023-FU4',
    'AD324-FU4': 'AD081-FU4'
  },
  proteinSequence: ['P0DTC9'],
};

const Pipeline = () => {
  const { token } = useAuth(); 
  const [algorithm, setAlgorithm] = useState(''); 
  const [files, setFiles] = useState({
    caseSample: [],
    controlSample: [],
    proteinSequence: [],
  }); 
  const [fileSources, setFileSources] = useState({
    caseControlSample: 'local',
    caseSample: 'local',
    controlSample: 'local',
    proteinSequence: 'local',
  }); 
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [errorMessage, setErrorMessage] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFile, setProcessedFile] = useState(null);

  useEffect(() => {
    let timer;
    if (running) {
      timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 80) {
            clearInterval(timer);
            return prevProgress;
          }
          return prevProgress + (80 / 360); 
        });
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [running]);

  useEffect(() => {
    if (processedFile && progress < 100) {
      setProgress(100);
    }
  }, [processedFile]);

  
  const handleAlgorithmChange = (event) => {
    setAlgorithm(event.target.value);
    setFiles({
      caseSample: [],
      controlSample: [],
      proteinSequence: [],
    });
    setFileSources({
      caseControlSample: 'local',
      caseSample: 'local',
      controlSample: 'local',
      proteinSequence: 'local',
    });
    setUploadedFiles([]);
    setErrorMessage('');
    setRunning(false);
    setProgress(0);
    setProcessedFile(null);
  };

  
  const handleFileChange = (event) => {
    const { name, files: selectedFiles } = event.target;
    const updatedFiles = { ...files, [name]: [...files[name], ...Array.from(selectedFiles)] };
    setFiles(updatedFiles);
    setUploadedFiles((prev) => {
      const filteredFiles = prev.filter(f => !files[name]?.includes(f));
      return [...filteredFiles, ...Array.from(selectedFiles)];
    });
    // console.log("file change")
  };

  const handleDefaultFileSelect = (name, file) => {
    let updatedFiles;
    // case/control 
    if (name === 'caseSample') {
      updatedFiles = { ...files, [name]: [file], controlSample: [defaultFiles.caseSample[file]] };
    } else {
      updatedFiles = { ...files, [name]: [file] }; 
    }
    setFiles(updatedFiles);
    setUploadedFiles((prev) => [...prev, ...updatedFiles[name]]);
    // console.log('Updated files after selecting default file:', updatedFiles);
    // console.log(files);
  };

  
  const handleFileSourceChange = (event, fileType) => {
    const value = event.target.value;
    // console.log("begin",fileSources);
    // console.log(`Changing file source for ${fileType} to ${value}`)
    setFileSources(prev => ({ ...prev, [fileType]: value }));
  
    
    if (fileType === 'caseControlSample') {
      setFiles(prev => ({ ...prev, caseSample: [], controlSample: [] }));
    } else if (fileType === 'proteinSequence') {
      setFiles(prev => ({ ...prev, proteinSequence: [] }));
    }
    // console.log(fileSources);
  };
  
  
  const downloadFile = async (fileType) => {
    try {
      const response = await axios.post('http://localhost:8000/api/download-result-zip/', {
        file_paths: processedFile, 
        file_type: fileType,       
      }, {
        responseType: 'blob', 
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'results.zip'); 
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      setErrorMessage('Error downloading file: ' + error.message);
    }
  };

  const uploadFiles = async (url, files, fieldName) => {
    const formData = new FormData();
  
    if (Array.isArray(files)) {
      files.forEach(file => formData.append(fieldName, file));
    } else {
      formData.append(fieldName, files);
    }
  
    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        }
      });
      if (Array.isArray(files)) {
        console.log(`Successfully uploaded files to ${url}:`, response.data.file_paths);
        return response.data.file_paths;
      } else {
        console.log(`Successfully uploaded file to ${url}:`, response.data.file_path);
        return response.data.file_path;
      }
    } catch (error) {
      console.error(`Error uploading file(s) to ${url}:`, error);
      throw error;
    }
  };

  const uploadDefaultFiles = async (url, caseFolder, controlFolder) => {
    try {
      const response = await axios.post(url, {
        case_folder: caseFolder,
        control_folder: controlFolder
      }, {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
  
      console.log(`Successfully processed file pair for ${caseFolder} and ${controlFolder}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error processing file pair for ${caseFolder} and ${controlFolder}:`, error);
      throw error;
    }
  };

  const uploadDefaultProteinFile = async (url, proteinFolder) => {
    try {
        const response = await axios.post(url, {
            protein_folder: proteinFolder
        }, {
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        });

        console.log(`Successfully processed protein folder ${proteinFolder}:`, response.data);
        return response.data.protein_file_path;
    } catch (error) {
        console.error(`Error processing protein folder ${proteinFolder}:`, error);
        throw error;
    }
  };

  const handleRun = async () => {
    if (!algorithm) {
      setErrorMessage('You must select an algorithm.');
      return;
    }
  
    setErrorMessage('');
    setRunning(true);
  
    try {
      let runResponse, caseFilePaths, controlFilePaths, proteinFilePath;
  
      // protein sequence
      // check
      if (files.proteinSequence.length !== 1) {
        setErrorMessage('You must submit exactly one protein sequence file.');
        setRunning(false);
        return;
      }
      // upload
      if (fileSources.proteinSequence === "local") {
        proteinFilePath = await uploadFiles('http://localhost:8000/api/upload-protein-file/', files.proteinSequence, 'protein_file');
      } else {
        proteinFilePath = await uploadDefaultProteinFile('http://localhost:8000/api/process-protein-file/', files.proteinSequence[0]);
      }
  
      if (algorithm === 'PIWAS' || algorithm === 'PIWAS+PIE') {
        if (fileSources.caseControlSample === "local") {
          if (files.caseSample.length !== 2) {
            setErrorMessage('You must submit exactly two case sample files (5-mer and 6-mer).');
            setRunning(false);
            return;
          }
          if (files.controlSample.length !== 2) {
            setErrorMessage('You must submit exactly two control sample files (5-mer and 6-mer).');
            setRunning(false);
            return;
          }
          
          caseFilePaths = await uploadFiles('http://localhost:8000/api/upload-case-files/', files.caseSample, 'case_files');
          controlFilePaths = await uploadFiles('http://localhost:8000/api/upload-control-files/', files.controlSample, 'control_files');
          
          if (!proteinFilePath) {
            setErrorMessage('Error uploading protein sequence file.');
            setRunning(false);
            return;
          }
        } else {
          if (files.caseSample.length !== 1) {
            setErrorMessage('You must select one default file pair.');
            setRunning(false);
            return;
          }
          const caseControlPaths = await uploadDefaultFiles('http://localhost:8000/api/process-file-pair/', files.caseSample[0], files.controlSample[0]);
          caseFilePaths = caseControlPaths.case_file_paths;
          controlFilePaths = caseControlPaths.control_file_paths;
        }
  
        const requestBody = {
          case_file_paths: {
            kmer_5: caseFilePaths.find(path => path.includes('5')),
            kmer_6: caseFilePaths.find(path => path.includes('6')),
          },
          control_file_paths: {
            kmer_5: controlFilePaths.find(path => path.includes('5')),
            kmer_6: controlFilePaths.find(path => path.includes('6')),
          },
          protein_file_path: proteinFilePath
        };
  
        // console.log(requestBody)
  
        runResponse = await axios.post(`http://localhost:8000/api/run-${algorithm.toLowerCase()}-algorithm/`, requestBody, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 600000
        });
      }
  
      else if (algorithm === 'PIE') {
        if (files.caseSample.length !== 1 || files.controlSample.length !== 1) {
          setErrorMessage('You must submit exactly two PIWAS result files (case result and control result).');
          setRunning(false);
          return;
        }
  
        let piwasCaseFilePath, piwasControlFilePath;
        const piwasResult = [files.caseSample[0], files.controlSample[0]];
        const piwasResultPaths = await uploadFiles('http://localhost:8000/api/upload-piwas-results/', piwasResult, 'piwas_result_files');
        if (!piwasResultPaths || piwasResultPaths.length < 2) {
          setErrorMessage('Error uploading PIWAS result files.');
          setRunning(false);
          return;
        }
        piwasCaseFilePath = piwasResultPaths.find(path => path.includes('case'));
        piwasControlFilePath = piwasResultPaths.find(path => path.includes('control'));
      
  
        runResponse = await axios.post('http://localhost:8000/api/run-pie-algorithm/', {
          piwas_case_file_path: piwasCaseFilePath,
          piwas_control_file_path: piwasControlFilePath,
          protein_file_path: proteinFilePath
        }, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 600000
        });
      }
  
      if (runResponse.data.status === 'success') {
        setProcessedFile(runResponse.data.file_paths);
      } else {
        setErrorMessage(runResponse.data.error || 'Unknown error occurred.');
      }
    } catch (error) {
      setErrorMessage('Error running pipeline: ' + (error.response?.data?.error || error.message));
    } finally {
      if (!processedFile) {
        setRunning(false);
      }
    }
  };

  const handleReset = () => {
    setAlgorithm('');
    setFiles({
      caseSample: [],
      controlSample: [],
      proteinSequence: [],
    });
    setFileSources({
      caseControlSample: 'local',
      caseSample: 'local',
      controlSample: 'local',
      proteinSequence: 'local',
    });
    setUploadedFiles([]);
    setErrorMessage('');
    setRunning(false);
    setProgress(0);
    setProcessedFile(null);
  };

  const handleFileDelete = (fileType, index) => {
    const updatedFiles = { ...files, [fileType]: files[fileType].filter((_, i) => i !== index) };
    setFiles(updatedFiles);
    setUploadedFiles(uploadedFiles.filter((file, i) => {
      const isCorrectFileType = Object.keys(files).some(key => files[key].includes(file) && key === fileType);
      return i !== index || !isCorrectFileType;
    }));
  };

  return (
    <>
      <NavBar />
      <Container component="main" maxWidth="md" sx={{ marginTop: 10, }}> 
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!running && !processedFile && (
            <Box sx={{ mt: 3, mb: 5, width: '100%' }}>
              <Paper elevation={3} sx={{ p: 3, backgroundColor: '#ffffff', mb: 5, position: 'relative', border: '1px solid #ccc' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', top: -20, left: 16, backgroundColor: '#ffffff', px: 1 }}>
                  <Typography variant="h6">
                    Algorithm Selection
                  </Typography>
                  <IconButton component={RouterLink} to="/#section2" sx={{ ml: 1 }}>
                    <HelpOutlineIcon />
                  </IconButton>
                </Box>
                <Select
                  fullWidth
                  value={algorithm}
                  onChange={handleAlgorithmChange}
                  displayEmpty
                  sx={{ mt: 3, mb: 3, height: 50 }}
                >
                  <MenuItem value="" disabled>Select an algorithm</MenuItem>
                  <MenuItem value="PIWAS">PIWAS</MenuItem>
                  <MenuItem value="PIE">PIE</MenuItem>
                  <MenuItem value="PIWAS+PIE">PIWAS+PIE</MenuItem>
                </Select>
              </Paper>

              {algorithm && (
                <Paper elevation={3} sx={{ p: 3, backgroundColor: '#ffffff', mb: 5, position: 'relative', border: '1px solid #ccc' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'absolute', top: -20, left: 16, backgroundColor: '#ffffff', px: 1 }}>
                  <Typography variant="h6">
                    {algorithm === 'PIE' ? 'Upload PIWAS Results and Protein Sequence' : 'Upload Files'}
                  </Typography>
                  <IconButton component={RouterLink} to="/#section4" sx={{ ml: 1 }}>
                    <HelpOutlineIcon />
                  </IconButton>
                </Box>
                {algorithm === 'PIE' ? (
                  <PIEUpload
                    fileSources={fileSources}
                    handleFileSourceChange={handleFileSourceChange}
                    files={files}
                    handleFileChange={handleFileChange}
                    handleFileDelete={handleFileDelete}
                    handleDefaultFileSelect={handleDefaultFileSelect}
                    defaultFiles={defaultFiles}
                  />
                ) : (
                  <PIWASUpload
                    fileSources={fileSources}
                    handleFileSourceChange={handleFileSourceChange}
                    files={files}
                    handleFileChange={handleFileChange}
                    handleFileDelete={handleFileDelete}
                    handleDefaultFileSelect={handleDefaultFileSelect}
                    defaultFiles={defaultFiles}
                  />
                )}
              </Paper>
              )}

              {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="contained" color="primary" onClick={handleRun}>
                  Run
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleReset}>
                  Reset
                </Button>
              </Box>
            </Box>
          )}

          {running && (
            <Box sx={{ width: '100%', mt: 40 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
                Running... {Math.round(progress)}%
              </Typography>
            </Box>
          )}

          {processedFile && (
            <ProcessedResult
              processedFile={processedFile}
              downloadFile={downloadFile}
              handleReset={handleReset}
              algorithm={algorithm}
            />
          )}
        </Box>
      </Container>
    </>
  );
};

export default Pipeline;
