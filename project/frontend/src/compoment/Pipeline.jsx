import React, { useState } from 'react';
import { Container, Box, Typography, MenuItem, Select, Button, Grid, Radio, RadioGroup, FormControlLabel, Paper, List, ListItem, ListItemText, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import NavBar from './NavBar';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import ProcessedResult from './ProcessedResult';
const defaultFiles = {
  caseSample: ['default_case_sample_1', 'default_case_sample_2'],
  controlSample: ['default_control_sample_1', 'default_control_sample_2'],
  proteinSequence: ['default_protein_sequence_1', 'default_protein_sequence_2'],
  piwasResult: ['default_piwas_case_result', 'default_piwas_control_result']
};

const Pipeline = () => {
  const { token } = useAuth(); // 从AuthContext获取Token
  const [algorithm, setAlgorithm] = useState('');
  const [files, setFiles] = useState({
    caseSample: [],
    controlSample: [],
    proteinSequence: [],
    piwasResult: [],
  });
  const [fileSources, setFileSources] = useState({
    caseSample: 'local',
    controlSample: 'local',
    proteinSequence: 'local',
    piwasResult: 'local',
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [running, setRunning] = useState(false);
  const [processedFile, setProcessedFile] = useState(null);

  const handleAlgorithmChange = (event) => {
    setAlgorithm(event.target.value);
  };

  const handleFileChange = (event) => {
    const { name, files: selectedFiles } = event.target;
    const updatedFiles = { ...files, [name]: [...files[name], ...Array.from(selectedFiles)] };
    setFiles(updatedFiles);
    setUploadedFiles((prev) => {
      const filteredFiles = prev.filter(f => !files[name]?.includes(f));
      return [...filteredFiles, ...Array.from(selectedFiles)];
    });
  };

  const handleDefaultFileSelect = (name, file) => {
    const updatedFiles = { ...files, [name]: [file] };
    setFiles(updatedFiles);
    setUploadedFiles((prev) => {
      const filteredFiles = prev.filter(f => !files[name]?.includes(f));
      return [...filteredFiles, { name: file, size: null }];
    });
  };

  const handleFileSourceChange = (event, fileType) => {
    setFileSources({ ...fileSources, [fileType]: event.target.value });
    const previousFiles = files[fileType];
    if (previousFiles.length > 0) {
      setUploadedFiles(prev => prev.filter(f => !previousFiles.includes(f)));
    }
    setFiles({ ...files, [fileType]: [] });
  };
   const downloadFile = async (filePath) => {
    try {
      const response = await axios.get('http://localhost:8000/api/download-result-file/', {
        params: { file_path: filePath },
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filePath.split('/').pop());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setErrorMessage('Error downloading file: ' + error.message);
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
      let runResponse;
  
      const uploadFiles = async (url, files, fieldName) => {
        const formData = new FormData();
        files.forEach(file => formData.append(fieldName, file));
        try {
          const response = await axios.post(url, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}` // 在请求头中包含Token
            }
          });
          console.log(`Successfully uploaded files to ${url}:`, response.data.file_paths);
          return response.data.file_paths;
        } catch (error) {
          console.error(`Error uploading files to ${url}:`, error);
          throw error;
        }
      };
  
      const uploadSingleFile = async (url, file, fieldName) => {
        const formData = new FormData();
        formData.append(fieldName, file);
        try {
          const response = await axios.post(url, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}` // 在请求头中包含Token
            }
          });
          console.log(`Successfully uploaded file to ${url}:`, response.data.file_path);
          return response.data.file_path;
        } catch (error) {
          console.error(`Error uploading file to ${url}:`, error);
          throw error;
        }
      };
  
      if (algorithm === 'PIWAS' || algorithm === 'PIWAS+PIE') {
        if (files.caseSample.length !== 2) {
          setErrorMessage('You must submit exactly two case sample files (5-mer and 6-mer).');
          return;
        }
        if (files.controlSample.length !== 2) {
          setErrorMessage('You must submit exactly two control sample files (5-mer and 6-mer).');
          return;
        }
        if (files.proteinSequence.length !== 1) {
          setErrorMessage('You must submit exactly one protein sequence file.');
          return;
        }
  
        const caseFilePaths = await uploadFiles('http://localhost:8000/api/upload-case-files/', files.caseSample, 'case_files');
        const controlFilePaths = await uploadFiles('http://localhost:8000/api/upload-control-files/', files.controlSample, 'control_files');
        const proteinFilePath = await uploadSingleFile('http://localhost:8000/api/upload-protein-file/', files.proteinSequence[0], 'protein_file');
  
        if (!proteinFilePath) {
          setErrorMessage('Error uploading protein sequence file.');
          return;
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
  
        if (algorithm === 'PIWAS+PIE') {
          requestBody.piwas_case_file_path = requestBody.case_file_paths.kmer_5;
          requestBody.piwas_control_file_path = requestBody.control_file_paths.kmer_6;
        }
  
        runResponse = await axios.post(`http://localhost:8000/api/run-${algorithm.toLowerCase()}-algorithm/`, requestBody, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 600000
        });
      }
  
      else if (algorithm === 'PIE') {
        if (fileSources.piwasResult === 'local' && files.piwasResult.length !== 2) {
          setErrorMessage('You must submit exactly two PIWAS result files (case result and control result).');
          return;
        }
  
        let piwasCaseFilePath, piwasControlFilePath;
        if (fileSources.piwasResult === 'local') {
          const piwasResultPaths = await uploadFiles('http://localhost:8000/api/upload-piwas-results/', files.piwasResult, 'piwas_result_files');
          if (!piwasResultPaths || piwasResultPaths.length < 2) {
            setErrorMessage('Error uploading PIWAS result files.');
            return;
          }
          piwasCaseFilePath = piwasResultPaths.find(path => path.includes('case'));
          piwasControlFilePath = piwasResultPaths.find(path => path.includes('control'));
        } else {
          piwasCaseFilePath = defaultFiles.piwasResult.find(file => file.includes('case'));
          piwasControlFilePath = defaultFiles.piwasResult.find(file => file.includes('control'));
        }
  
        let proteinFilePath;
        if (fileSources.proteinSequence === 'local') {
          const proteinResponse = await uploadSingleFile('http://localhost:8000/api/upload-protein-file/', files.proteinSequence[0], 'protein_file');
          if (!proteinResponse) {
            setErrorMessage('Error uploading protein sequence file.');
            return;
          }
          proteinFilePath = proteinResponse;
        } else {
          proteinFilePath = defaultFiles.proteinSequence[0];
        }
  
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
        setErrorMessage(runResponse.data.message);
      }
    } catch (error) {
      setErrorMessage('Error running pipeline: ' + error.message);
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setAlgorithm('');
    setFiles({
      caseSample: [],
      controlSample: [],
      proteinSequence: [],
      piwasResult: [],
    });
    setFileSources({
      caseSample: 'local',
      controlSample: 'local',
      proteinSequence: 'local',
      piwasResult: 'local',
    });
    setUploadedFiles([]);
    setErrorMessage('');
    setRunning(false);
    setProcessedFile(null);
  };

  const handleFileDelete = (fileType, index) => {
    const updatedFiles = { ...files, [fileType]: files[fileType].filter((_, i) => i !== index) };
    setFiles(updatedFiles);
    setUploadedFiles(uploadedFiles.filter((file, i) => {
      // 确保删除正确的文件类型
      const isCorrectFileType = Object.keys(files).some(key => files[key].includes(file) && key === fileType);
      return i !== index || !isCorrectFileType;
    }));
  };

  return (
    <>
      <NavBar />
      <Container component="main" maxWidth="md">
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!running && !processedFile && (
            <Box sx={{ mt: 3, mb: 5, width: '100%' }}>
                            <Paper elevation={3} sx={{ p: 3, backgroundColor: '#ffffff', mb: 5, position: 'relative', border: '1px solid #ccc' }}>
                <Typography variant="h6" sx={{ position: 'absolute', top: -20, left: 16, backgroundColor: '#ffffff', px: 1 }}>
                  Algorithm Selection
                </Typography>
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
                  <Typography variant="h6" sx={{ position: 'absolute', top: -20, left: 16, backgroundColor: '#ffffff', px: 1 }}>
                    {algorithm === 'PIE' ? 'Upload PIWAS Results and Protein Sequence' : 'Upload Files'}
                  </Typography>
                  {algorithm !== 'PIE' && ['caseSample', 'controlSample', 'proteinSequence'].map((fileType, index) => (
                    <Box key={index} sx={{ mt: 2 }}>
                      <Typography>{fileType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12}>
                          <RadioGroup
                            row
                            name={fileType}
                            value={fileSources[fileType]}
                            onChange={(e) => handleFileSourceChange(e, fileType)}
                          >
                            <FormControlLabel value="local" control={<Radio />} label="Upload from local" />
                            <FormControlLabel value="default" control={<Radio />} label="Select default file"/>
                          </RadioGroup>
                        </Grid>
                        <Grid item xs={12}>
                          {fileSources[fileType] === 'local' ? (
                            <div>
                              <input
                                type="file"
                                name={fileType}
                                multiple={fileType !== 'proteinSequence'}
                                onChange={handleFileChange}
                                style={{ display: 'block', marginBottom: '10px' }}
                              />
                              <List>
                                {files[fileType].map((file, idx) => (
                                  <ListItem key={idx} secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete(fileType, idx)}>
                                      <DeleteIcon />
                                    </IconButton>
                                  }>
                                    <ListItemText primary={file.name} />
                                  </ListItem>
                                ))}
                              </List>
                              {files[fileType].length > 0 && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                  Selected {files[fileType].length} files for {fileType.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </Typography>
                              )}
                            </div>
                          ) : (
                            <div>
                              <Select
                                fullWidth
                                displayEmpty
                                onChange={(event) => handleDefaultFileSelect(fileType, event.target.value)}
                                value={files[fileType][0] || ''}
                                sx={{ height: 40 }}
                              >
                                <MenuItem value="" disabled>Select a default file</MenuItem>
                                {defaultFiles[fileType].map((file, index) => (
                                  <MenuItem key={index} value={file}>{file}</MenuItem>
                                ))}
                              </Select>
                              {files[fileType].length > 0 && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                  Selected default file: {files[fileType][0]}
                                </Typography>
                              )}
                            </div>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                  {algorithm === 'PIE' && (
                    <>
                      <Box sx={{ mt: 2 }}>
                        <Typography>PIWAS Results</Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12}>
                            <RadioGroup
                              row
                              name="piwasCaseResult"
                              value={fileSources.piwasResult}
                              onChange={(e) => handleFileSourceChange(e, 'piwasResult')}
                            >
                              <FormControlLabel value="local" control={<Radio />} label="Upload from local" />
                              <FormControlLabel value="default" control={<Radio />} label="Select default file"/>
                            </RadioGroup>
                          </Grid>
                          <Grid item xs={12}>
                            {fileSources.piwasResult === 'local' ? (
                              <div>
                                <input
                                  type="file"
                                  name="piwasResult"
                                  multiple
                                  onChange={handleFileChange}
                                  style={{ display: 'block', marginBottom: '10px' }}
                                />
                                <List>
                                  {files.piwasResult.map((file, idx) => (
                                    <ListItem key={idx} secondaryAction={
                                      <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete('piwasResult', idx)}>
                                        <DeleteIcon />
                                      </IconButton>
                                    }>
                                      <ListItemText primary={file.name} />
                                    </ListItem>
                                  ))}
                                </List>
                                {files.piwasResult.length > 0 && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                    Selected {files.piwasResult.length} PIWAS result files
                                  </Typography>
                                )}
                              </div>
                            ) : (
                              <div>
                                <Select
                                  fullWidth
                                  displayEmpty
                                  onChange={(event) => handleDefaultFileSelect('piwasResult', event.target.value)}
                                  value={files.piwasResult[0] || ''}
                                  sx={{ height: 40 }}
                                >
                                  <MenuItem value="" disabled>Select a default file</MenuItem>
                                  {defaultFiles.piwasResult.map((file, index) => (
                                    <MenuItem key={index} value={file}>{file}</MenuItem>
                                  ))}
                                </Select>
                                {files.piwasResult.length > 0 && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                    Selected default file: {files.piwasResult[0]}
                                  </Typography>
                                )}
                              </div>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography>Protein Sequence</Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12}>
                            <RadioGroup
                              row
                              name="proteinSequence"
                              value={fileSources.proteinSequence}
                              onChange={(e) => handleFileSourceChange(e, 'proteinSequence')}
                            >
                              <FormControlLabel value="local" control={<Radio />} label="Upload from local" />
                              <FormControlLabel value="default" control={<Radio />} label="Select default file"/>
                            </RadioGroup>
                          </Grid>
                          <Grid item xs={12}>
                            {fileSources.proteinSequence === 'local' ? (
                              <div>
                                <input
                                  type="file"
                                  name="proteinSequence"
                                  onChange={handleFileChange}
                                  style={{ display: 'block', marginBottom: '10px' }}
                                />
                                <List>
                                  {files.proteinSequence.map((file, idx) => (
                                    <ListItem key={idx} secondaryAction={
                                      <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete('proteinSequence', idx)}>
                                        <DeleteIcon />
                                      </IconButton>
                                    }>
                                      <ListItemText primary={file.name} />
                                    </ListItem>
                                  ))}
                                </List>
                                {files.proteinSequence.length > 0 && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                    Selected {files.proteinSequence.length} protein sequence files
                                  </Typography>
                                )}
                              </div>
                            ) : (
                              <div>
                                <Select
                                  fullWidth
                                  displayEmpty
                                  onChange={(event) => handleDefaultFileSelect('proteinSequence', event.target.value)}
                                  value={files.proteinSequence[0] || ''}
                                  sx={{ height: 40 }}
                                >
                                  <MenuItem value="" disabled>Select a default file</MenuItem>
                                  {defaultFiles.proteinSequence.map((file, index) => (
                                    <MenuItem key={index} value={file}>{file}</MenuItem>
                                  ))}
                                </Select>
                                {files.proteinSequence.length > 0 && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                                    Selected default file: {files.proteinSequence[0]}
                                  </Typography>
                                )}
                              </div>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </>
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
  
          {running && <Typography>Running...</Typography>}
  
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
