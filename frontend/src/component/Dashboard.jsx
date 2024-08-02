import React, { useEffect, useState } from "react";
import { scroller } from "react-scroll";
import { useSpring, animated } from 'react-spring'; 
import { useInView } from 'react-intersection-observer'; 
import backgroundImage from '../assets/background.jpg'; 
import seraImage from '../assets/SERA-Platform.png';
import pie from '../assets/PIE.png';
import piwas from '../assets/PIWAS.png';
import long_covid from '../assets/long-covid.png';
import NavBar from "./NavBar";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { IconButton } from '@mui/material';
import { useLocation } from 'react-router-dom';

function Dashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [navBarHeight, setNavBarHeight] = useState(100);
  const location = useLocation(); 

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > 50) {
        setNavBarHeight(60);
      } else {
        setNavBarHeight(100);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  
  useEffect(() => {
    if (location.hash) {
      scroller.scrollTo(location.hash.substring(1), {
        duration: 1500,
        delay: 0,
        smooth: 'easeInOutQuart',
      });
    }
  }, [location]);

  const dashboardStyle = {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'opacity 1s ease-in-out',
    opacity: isVisible ? 1 : 0,
  };

  const backgroundStyle = {
    content: '""',
    position: 'fixed', 
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#4f2479',
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.6, 
    zIndex: -1, 
    backgroundBlendMode: 'multiply',
  };

  const textContainerStyle = {
    position: 'absolute',
    width: '80vw',
    top: '50%', 
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: 'black',
    zIndex: 1, 
  };

  const titleStyle1 = {
    fontSize: '42px',
    fontWeight: 'bold',
    width: 'auto',
    marginBottom: '40px',
    color: 'white',
  };

  const paragraphStyle1 = {
    maxWidth: '80vw', 
    fontSize: '24px',
    marginTop: '20px',
    fontWeight: 'bold',
    lineHeight: '1.4',
    color: 'white',
  };

  const titleStyle = {
    color: '#3c2e5f',
    fontSize: '42px',
    fontWeight: 'bold',
    width: 'auto',
    marginBottom: '40px',
  };

  const paragraphStyle = {
    color: '#3c2e5f',
    maxWidth: '80vw', 
    fontSize: '24px',
    marginTop: '20px',
    fontWeight: 'bold',
    lineHeight: '1.4',
  };

  const whiteSectionStyle = {
    ...dashboardStyle,
    backgroundImage: 'linear-gradient(to right, white 0%, #E9EBFE 100%)',
    color: 'black',
  };

  const arrowButtonStyle = {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1,
  };

  const handleArrowClick = (section) => {
    scroller.scrollTo(section, {
      duration: 1500,
      delay: 0,
      smooth: 'easeInOutQuart',
    });
  };

  const AnimatedSection = ({ id, title, paragraph, imageSrc, children, showArrow = true }) => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    const titleAnimation = useSpring({
      opacity: inView ? 1 : 0,
      config: { duration: 1000 },
    });
    const paragraphAnimation = useSpring({
      transform: inView ? 'translateY(0)' : 'translateY(100%)',
      opacity: inView ? 1 : 0,
      config: { duration: 1000 },
    });

    return (
      <div ref={ref} id={id} style={whiteSectionStyle}>
        <div style={textContainerStyle}>
          <animated.div style={{ ...titleStyle, ...titleAnimation }}>{title}</animated.div>
          <animated.div style={{ ...paragraphStyle, ...paragraphAnimation }}>{paragraph}</animated.div>
          {imageSrc && <img src={imageSrc} style={{ height: '40vh', marginTop: '40px' }} alt={`${id}_image`} />}
          {children}
        </div>
        {showArrow && (
          <IconButton onClick={() => handleArrowClick(`section${parseInt(id.slice(-1)) + 1}`)} style={arrowButtonStyle}>
            <ArrowDownwardIcon fontSize="large" />
          </IconButton>
        )}
      </div>
    );
  };

  return (
    <>
      <NavBar navBarHeight={navBarHeight} />
      <div style={backgroundStyle}></div>
      <div className="section" id="section1" style={dashboardStyle}>
        <div style={textContainerStyle}>
          <div style={titleStyle1}>Welcome to ProteoInsight</div>
          <div style={paragraphStyle1}>
            An advanced platform focused on protein analysis. We use the latest PIWAS and PIE algorithms to provide you with comprehensive and accurate proteomics data analysis and insights. Whether you are a researcher, bioinformatics expert, or a professional engaged in biomedical research, ProteoInsight will be your right-hand assistant for protein research and analysis.
          </div>
        </div>
        <IconButton sx={{ color: 'white' }} onClick={() => handleArrowClick('section2')} style={arrowButtonStyle}>
          <ArrowDownwardIcon fontSize="large" />
        </IconButton>
      </div>
      <AnimatedSection
        id="section2"
        title="Analysis Algorithm - PIWAS"
        paragraph="Protein-based Immunome Wide Association Study (PIWAS) is designed to identify antigen and epitope signals against a reference proteome by scoring and smoothing k-mers tiled onto the protein sequence."
        imageSrc={piwas}
      />
      <AnimatedSection
        id="section3"
        title="Analysis Algorithm - PIE"
        paragraph="Protein-wide Identification of Epitopes (PIE) is a complementary algorithm used to locate regions within the protein sequence that exhibit strong outlier signals, identifying regions of interest based on statistical significance."
        imageSrc={pie}
      />
      <AnimatedSection
        id="section4"
        title="About input data"
        paragraph={
          <>
            The input data is come from Serum Epitope Repertoire Analysis (SERA) Platform. Combining universal chemistry with proprietary informatics, SERA assesses antibody repertoires to address research and clinical needs. For more information, visit <a href="https://serimmune.com/technology/#sera" target="_blank" rel="noopenernoreferrer">Serimmune</a> website.
          </>
        }
        imageSrc={seraImage}
      />
      <AnimatedSection
        id="section5"
        title="Default Library"
        paragraph="The default library includes paired case/control samples from long COVID cases, which are used to study the immune response in long COVID patients. Feel free to check it out and further explore the related data."
        showArrow={false}
      >
        <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10620090/" target="_blank" rel="noopener noreferrer">
          <img src={long_covid} style={{ height: '50vh', marginTop: '40px' }} alt="long_covid_article" />
        </a>
      </AnimatedSection>
    </>
  );
}

export default Dashboard;