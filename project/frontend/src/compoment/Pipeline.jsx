import React, { useState } from 'react';
import { Container, Box, Typography, MenuItem, Select, Button, Grid, Radio, RadioGroup, FormControlLabel, Paper, List, ListItem, ListItemText, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import NavBar from './NavBar';
import axios from 'axios';

const defaultFiles = {
  caseSample: ['default_case_sample_1', 'default_case_sample_2'],
  controlSample: ['default_control_sample_1', 'default_control_sample_2'],
  proteinSequence: ['default_protein_sequence_1', 'default_protein_sequence_2']
};

const Pipeline = () => {
  const [algorithm, setAlgorithm] = useState('');
  const [files, setFiles] = useState({
    caseSample: [],
    controlSample: [],
    proteinSequence: [],
  });
  const [fileSources, setFileSources] = useState({
    caseSample: 'local',
    controlSample: 'local',
    proteinSequence: 'local',
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

  const handleRun = async () => {
    // 验证算法选择
    if (!algorithm) {
      setErrorMessage('You must select an algorithm.');
      return;
    }
    // 验证文件提交条件
    if (files.caseSample.length === 0) {
      setErrorMessage('You must submit at least one case sample file.');
      return;
    }
    if (files.controlSample.length === 0) {
      setErrorMessage('You must submit at least one control sample file.');
      return;
    }
    if (files.proteinSequence.length !== 1) {
      setErrorMessage('You must submit exactly one protein sequence file.');
      return;
    }
  
    // 清除错误消息
    setErrorMessage('');
  
    console.log(algorithm, files);
    const formData = new FormData();
    formData.append('algorithm', algorithm);
    Object.keys(files).forEach(fileType => {
      files[fileType].forEach(file => {
        if (file.size) {
          formData.append(fileType, file);
        } else {
          formData.append(`${fileType}_default`, file.name);
        }
      });
    });
  
    try {
      // 第一次请求
      const response = await axios.post('http://localhost:8000/api/pipeline/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.data.status === 'success') {
        // 显示正在运行的图片或状态
        setRunning(true);
  
        // 开始轮询或使用 WebSocket 接收第二次消息
        const result = await axios.get('http://localhost:8000/api/pipeline/result');
        setRunning(false);
        setProcessedFile(result.data.file);
      } else {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      setErrorMessage('Error running pipeline: ' + error.message);
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
      caseSample: 'local',
      controlSample: 'local',
      proteinSequence: 'local',
    });
    setUploadedFiles([]);
    setErrorMessage('');
    setRunning(false);
    setProcessedFile(null);
  };

  const handleFileDelete = (fileType, index) => {
    const updatedFiles = { ...files, [fileType]: files[fileType].filter((_, i) => i !== index) };
    setFiles(updatedFiles);
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
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
  
              <Paper elevation={3} sx={{ p: 3, backgroundColor: '#ffffff', mb: 5, position: 'relative', border: '1px solid #ccc' }}>
                <Typography variant="h6" sx={{ position: 'absolute', top: -20, left: 16, backgroundColor: '#ffffff', px: 1 }}>
                  Upload Files
                </Typography>
                {['caseSample', 'controlSample', 'proteinSequence'].map((fileType, index) => (
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
                          <FormControlLabel value="default" control={<Radio />} label="Select default file" />
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
              </Paper>
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
            <div>
              <Typography>Process completed. Download the result below:</Typography>
              <Button href={processedFile} download>
                Download Processed File
              </Button>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" color="primary" onClick={handleReset}>
                  New Pipeline
                </Button>
              </Box>
            </div>
          )}
          
        </Box>
      </Container>
    </>
  );
};

export default Pipeline;