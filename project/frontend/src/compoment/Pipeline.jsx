import React, { useState } from 'react';
import NavBar from './NavBar';
import { TextField, Button, Box, Container, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { fetchRequest } from './api'; // fetchRequest函数
import { saveAs } from 'file-saver'; // 用于下载文件

const algorithms = [
  { value: 'PIWAS', label: 'PIWAS' },
  { value: 'PIE', label: 'PIE' },
  { value: 'PIWAS&PIE', label: 'PIWAS & PIE' }
];

const functionsByAlgorithm = {
  PIWAS: ['Function 1', 'Function 2'],
  PIE: ['Function 3', 'Function 4'],
  'PIWAS&PIE': ['Function 5', 'Function 6']
};

const Pipeline = () => {
  const [algorithm, setAlgorithm] = useState('');
  const [functionality, setFunctionality] = useState('');
  const [fileSource, setFileSource] = useState('');
  const [file, setFile] = useState(null);
  const [resultImage, setResultImage] = useState('');
  const [downloadLink, setDownloadLink] = useState('');

  const handleAlgorithmChange = (event) => {
    setAlgorithm(event.target.value);
    setFunctionality('');
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('algorithm', algorithm);
    formData.append('functionality', functionality);
    formData.append('fileSource', fileSource);
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetchRequest('http://localhost:8000/api/pipeline', 'POST', formData);
      setResultImage(response.imagePath); // 假设响应中包含图像路径
      setDownloadLink(response.dataPath); // 假设响应中包含数据路径
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReset = () => {
    setAlgorithm('');
    setFunctionality('');
    setFileSource('');
    setFile(null);
    setResultImage('');
    setDownloadLink('');
  };

  const handleDownload = () => {
    if (downloadLink) {
      saveAs(downloadLink, 'data.csv'); // 假设数据文件是 CSV 格式
    }
  };

  return (
    <>
      <NavBar/>
      <Container component="main" maxWidth="md">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Pipeline
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="algorithm-label">Algorithm</InputLabel>
              <Select
                labelId="algorithm-label"
                id="algorithm"
                value={algorithm}
                label="Algorithm"
                onChange={handleAlgorithmChange}
                required
              >
                {algorithms.map((algo) => (
                  <MenuItem key={algo.value} value={algo.value}>
                    {algo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {algorithm && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="functionality-label">Functionality</InputLabel>
                <Select
                  labelId="functionality-label"
                  id="functionality"
                  value={functionality}
                  label="Functionality"
                  onChange={(event) => setFunctionality(event.target.value)}
                  required
                >
                  {functionsByAlgorithm[algorithm].map((func, index) => (
                    <MenuItem key={index} value={func}>
                      {func}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel id="fileSource-label">File Source</InputLabel>
              <Select
                labelId="fileSource-label"
                id="fileSource"
                value={fileSource}
                label="File Source"
                onChange={(event) => setFileSource(event.target.value)}
                required
              >
                <MenuItem value="upload">Upload from local</MenuItem>
                <MenuItem value="provided">Use provided file</MenuItem>
              </Select>
            </FormControl>
            {fileSource === 'upload' && (
              <FormControl fullWidth margin="normal">
                <input type="file" onChange={handleFileChange} required />
              </FormControl>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button variant="contained" color="primary" type="submit">
                Submit
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleReset}>
                Reset
              </Button>
            </Box>
          </Box>
          {resultImage && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6">Result:</Typography>
              <img src={resultImage} alt="Result" style={{ maxWidth: '100%', marginTop: 16 }} />
              <Button variant="contained" color="primary" onClick={handleDownload} sx={{ mt: 2 }}>
                Download Data
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </>  
  );
};

export default Pipeline;