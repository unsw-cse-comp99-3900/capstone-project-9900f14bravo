# Capstone Project

This is the bioinformatics project developed by our Bravo group, thanks to all the COMP9900 teachers and our tutor！

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Technologies Used](#technologies-used)

## Introduction

The purpose of this project is to develop a web platform that can process SERA
data through two algorithms: Protein-Based Immunome Wide Association Study
(PIWAS) and Protein Epitope Wide Identification (PIE). The platform enables
users to execute two data analysis algorithms independently, and in combination.
It also produces visualization results and processed data for further study.

## Features

- User authentication (login, registration, password reset)
- Data upload and processing
- PIWAS&PIE algorithm implementation
- Visualization of results
- Downloadable results in CSV and Excel formats

## Installation

### Prerequisites

- Docker
- Docker Compose

### Steps
1. **Clone the repository:**

   ```bash
   git clone https://github.com/unsw-cse-comp99-3900-24t1/capstone-project-9900f14bravo.git
   ```
   ```bash
   cd capstone-project-9900f14bravo
   ```
2. **Download the default files(library)**

   you need to click https://unsw-my.sharepoint.com/:u:/r/personal/z5200977_ad_unsw_edu_au/Documents/data.zip?csf=1&web=1&e=5ArEkN and then dowload the "data".<br>
   Unzip the "data" file and put it under the project's backend/media, note that the entire default folder is named "data", don't change it.

3. **Build and run the application using Docker Compose:**

    ```bash
    docker-compose up --build -d
    ```
    Due to the large project files, docker compose takes about 5-10 minutes to run<br><br>
    This is an example of the result：
   ![image](https://github.com/user-attachments/assets/4ceed677-6368-4336-9c25-1d1beb7dfe6e)


5. **Access the application:**

   After the previous step, you can open the container in the docker app, find the project name "capstone-project" and click start,
   after that you can start the project by typing localhost:3000 in your browser
   ![image](https://github.com/user-attachments/assets/ac4ec0f4-8fd3-4e37-b17a-42c48c8a41ac)

6. **Stop the application:**

   To stop the application, use the following command:

    ```bash
    docker-compose down
    ```
   Or you can click on the docker app
   ![image](https://github.com/user-attachments/assets/e77040f7-c9e7-4a51-a1b7-9314b43903a7)

7. **Test User**

   We provide test accounts as follows:

    - **Username**: `VinayakKuanr`
    - **Password**: `VinayakKuanr@unsw`
    - **Security Question**: What was your childhood nickname?
    - **Answer**: `VDK`

## Technologies Used

  ### Backend
  
  - **Django**: Web framework for building the backend of the application.
  - **Django REST Framework**: For building RESTful APIs.
  - **SQLite**: Database for storing user data and analysis results.
  
  ### Frontend
  
  - **React**: JavaScript library for building the frontend of the application.
  - **Material-UI**: UI framework for React to create a responsive user interface.
  
  ### Deployment
  
  - **Docker**: For containerizing the application.
  - **Docker Compose**: For orchestrating multi-container Docker applications.
