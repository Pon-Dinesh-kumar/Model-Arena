import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useRouteMusic } from '../presentation/hooks/useRouteMusic';

// Declare the global VANTA object
declare global {
  interface Window {
    VANTA: {
      DOTS: (options: any) => any;
    };
  }
}

const About = () => {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>('about');
  const headerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [spotlightMember, setSpotlightMember] = useState<number | null>(null);
  const [stats, setStats] = useState({
    models: 0,
    games: 0,
    gamemodes: 0,
    contributors: 0
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [collectedTrophies, setCollectedTrophies] = useState<string[]>([]);
  const [showTrophyNotification, setShowTrophyNotification] = useState(false);
  const [newTrophy, setNewTrophy] = useState<string>('');
  const [showTrophyCase, setShowTrophyCase] = useState(false);
  const [hoveredTrophy, setHoveredTrophy] = useState<string | null>(null);
  useRouteMusic();

  // Sound effects
  const playSound = (sound: string) => {
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.3;
    audio.play();
  };

  // Timeline data
  const timelineData = [
    {
      year: "April 23, 2025",
      event: "Project Launch",
      description: "Model Arena was born from Pon Dinesh Kumar M's vision to create a competitive yet educational AI arena",
      icon: "🚀",
      achievement: "Founder"
    },
    {
      year: "May 2025",
      event: "First Team Members",
      description: "Vignesh (Vicky), Kiruthik Kumar M, and Prakadesh (Pro) joined the team",
      icon: "👥",
      achievement: "Team Formation"
    },
    {
      year: "May 2025",
      event: "First Games",
      description: "Developed 2 games with 2 game modes for model battles",
      icon: "🎮",
      achievement: "Game Master"
    },
    {
      year: "June 1, 2025",
      event: "Platform Launch",
      description: "First version deployment with live model battles",
      icon: "🏆",
      achievement: "Champion"
    }
  ];

  // Team members data
  const teamMembers = [
    {
      name: "Pon Dinesh Kumar M",
      aka: "Master Mind",
      role: "Founder & Lead Developer",
      bio: "The visionary behind Model Arena, overseeing all aspects of development and innovation. From architecture to implementation, I make sure everything comes together perfectly.",
      socials: {
        twitter: "#",
        github: "#",
        linkedin: "#"
      },
      avatar: "/profile/1.jpg",
      hoverAvatar: "/profile/1h.jpg",
      funFact: "Can code, design, and debug simultaneously while drinking coffee",
      achievements: ["Platform Architect", "Game Designer", "AI Enthusiast"],
      level: 99,
      xp: 9999
    },
    {
      name: "Vignesh",
      aka: "Vicky",
      role: "Frontend & Architecture Lead",
      bio: "Specializing in responsive design, code optimization, and clean architecture. Currently working on bug fixes and performance improvements to make Model Arena smoother than ever.",
      socials: {
        twitter: "#",
        github: "#",
        linkedin: "#"
      },
      avatar: "/profile/2.jpg",
      hoverAvatar: "/profile/2h.jpg",
      funFact: "Can spot a CSS bug from a mile away",
      achievements: ["Code Optimizer", "UI/UX Expert", "Bug Hunter"],
      level: 85,
      xp: 8500
    },
    {
      name: "Kiruthik Kumar M",
      aka: "Game Master",
      role: "Game Developer",
      bio: "Creating engaging game modes and content. Currently working on the Rock Paper Scissors game and developing new exciting game modes for model battles.",
      socials: {
        twitter: "#",
        github: "#",
        linkedin: "#"
      },
      avatar: "/profile/3.jpg",
      hoverAvatar: "/profile/3h.jpg",
      funFact: "Can turn any game concept into reality",
      achievements: ["Game Developer", "Content Creator", "Challenge Designer"],
      level: 80,
      xp: 8000
    },
    {
      name: "Prakadesh",
      aka: "Pro",
      role: "ML Integration Lead",
      bio: "Working on ML model upload and evaluation logic. Making sure models can be easily integrated and fairly evaluated in our battle arenas.",
      socials: {
        twitter: "#",
        github: "#",
        linkedin: "#"
      },
      avatar: "/profile/4.jpg",
      hoverAvatar: "/profile/4h.jpg",
      funFact: "Can optimize any ML model for battle",
      achievements: ["ML Expert", "Model Evaluator", "Integration Specialist"],
      level: 75,
      xp: 7500
    }
  ];

  // Contribution steps
  const contributionSteps = [
    {
      step: "1",
      title: "Explore Our GitHub",
      description: "Check out our open-source repositories and find issues to work on",
      icon: "🔍",
      hoverText: "Browse our codebase",
      benefits: ["View project structure", "Understand codebase", "Find interesting issues"],
      xp: 100
    },
    {
      step: "2",
      title: "Set Up Development",
      description: "Fork the repository and set up your development environment",
      icon: "⚙️",
      hoverText: "Get started with development",
      benefits: ["Local setup guide", "Development tools", "Testing environment"],
      xp: 200
    },
    {
      step: "3",
      title: "Make Your Contribution",
      description: "Implement features, fix bugs, or improve documentation",
      icon: "💻",
      hoverText: "Start coding",
      benefits: ["Code contribution", "Bug fixes", "Documentation updates"],
      xp: 300
    },
    {
      step: "4",
      title: "Submit & Review",
      description: "Create a pull request and participate in code review",
      icon: "📝",
      hoverText: "Share your work",
      benefits: ["PR guidelines", "Code review process", "Community feedback"],
      xp: 400
    }
  ];

  // Remove achievement badges data
  const achievementBadges = [
    { name: "Team Application", icon: "👋", description: "Submitted team application", sound: "submit" }
  ];

  // Mini-game data
  const miniGameData = {
    target: "🤖",
    obstacles: ["💥", "🔥", "⚡"],
    powerUps: ["⭐", "💫", "✨"],
    scoreMultipliers: [1, 2, 3]
  };

  // Easter egg handler
  const handleEasterEgg = () => {
    setShowEasterEgg(true);
    playSound("easter-egg");
    setTimeout(() => setShowEasterEgg(false), 3000);
  };

  // Achievement unlock handler
  const unlockAchievement = (achievement: string) => {
    if (!unlockedAchievements.includes(achievement)) {
      setUnlockedAchievements([...unlockedAchievements, achievement]);
      playSound("achievement");
    }
  };

  // Level up handler
  const handleLevelUp = () => {
    setShowLevelUp(true);
    playSound("level-up");
    setTimeout(() => setShowLevelUp(false), 2000);
    setCurrentLevel(currentLevel + 1);
  };

  // Progress update handler
  const updateProgress = (newProgress: number) => {
    setProgress(newProgress);
    if (newProgress >= 100) {
      handleLevelUp();
      setProgress(0);
    }
  };

  // Animate statistics
  useEffect(() => {
    const targetStats = {
      models: 6,
      games: 2,
      gamemodes: 2,
      contributors: 4
    };

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setStats({
        models: Math.floor((targetStats.models * currentStep) / steps),
        games: Math.floor((targetStats.games * currentStep) / steps),
        gamemodes: Math.floor((targetStats.gamemodes * currentStep) / steps),
        contributors: Math.floor((targetStats.contributors * currentStep) / steps)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current && window.VANTA) {
      setVantaEffect(
        window.VANTA.DOTS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          backgroundColor: 0x13002A,
          color: 0xFF3CBD,
          color2: 0x00F2A9,
          size: 3,
          spacing: 35,
          showLines: true
        })
      );
    }

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  // Parallax and header glow effect
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (window.scrollY > 10) {
          headerRef.current.classList.add('header-glow');
        } else {
          headerRef.current.classList.remove('header-glow');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update trophy data
  const trophies = {
    'about': {
      'funFact': 'Fun Fact Finder',
      'timeline': 'History Buff',
      'games': 'Game Explorer',
      'challenges': 'Challenge Seeker'
    },
    'team': {
      'member1': 'Team Explorer',
      'member2': 'Team Explorer',
      'member3': 'Team Explorer',
      'member4': 'Team Explorer',
      'title': 'Human Finder'
    },
    'contribute': {
      'step1': 'Code Explorer',
      'step2': 'Setup Expert',
      'step3': 'Contributor',
      'step4': 'Review Master',
      'logo': 'Logo Hunter'
    }
  };

  // Add trophy collection animation component
  const TrophyAnimation = ({ trophyId }: { trophyId: string }) => {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="animate-trophy-collect transform scale-0">
          <div className="text-6xl text-yellow-400">🏆</div>
        </div>
      </div>
    );
  };

  // Add trophy collection handler
  const collectTrophy = (trophyId: string) => {
    if (!collectedTrophies.includes(trophyId)) {
      setCollectedTrophies([...collectedTrophies, trophyId]);
      setNewTrophy(trophyId);
      setShowTrophyNotification(true);
      playSound("achievement");
      setTimeout(() => setShowTrophyNotification(false), 3000);
    }
  };

  // Add trophy counter component
  const TrophyCounter = ({ section }: { section: string }) => {
    const sectionTrophies = Object.keys(trophies[section as keyof typeof trophies]);
    const collected = sectionTrophies.filter(t => collectedTrophies.includes(t)).length;
    const total = sectionTrophies.length;

    return (
      <div className="flex items-center gap-2">
        <span className="text-yellow-400">🏆</span>
        <span className="text-gray-300">{collected}/{total}</span>
      </div>
    );
  };

  // Update trophy case component
  const TrophyCase = () => {
    return (
      <div className="fixed bottom-4 right-4 glass-effect-strong p-4 rounded-lg z-50">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-2xl">🏆</span>
          <span className="text-gray-300">
            {collectedTrophies.length}/{Object.keys(trophies).reduce((acc, section) => 
              acc + Object.keys(trophies[section as keyof typeof trophies]).length, 0
            )} Collected
          </span>
        </div>
      </div>
    );
  };

  // Update TrophyLocation component
  const TrophyLocation = ({ children, trophyId, className = '' }: { children: React.ReactNode, trophyId: string, className?: string }) => {
    const isCollected = collectedTrophies.includes(trophyId);
    return (
      <div 
        className={`relative group ${!isCollected ? 'cursor-pointer' : ''} ${className}`}
        onClick={() => !isCollected && collectTrophy(trophyId)}
      >
        {children}
        {!isCollected && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF3CBD]/10 to-[#00F2A9]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
        )}
        {isCollected && (
          <div className="absolute -top-2 -right-2 text-yellow-400 text-sm">
            🏆
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Vanta.js Background */}
      <div ref={vantaRef} className="fixed inset-0 w-full h-full -z-10" />

      {/* Header */}
      <header ref={headerRef} className="w-full px-6 py-3 flex justify-between items-center glass-effect-strong fixed top-0 left-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-1">
          <TrophyLocation trophyId="logo" className="flex items-center gap-1">
            <img src="/logo.png" alt="Model Arena Logo" className="h-10 w-10 align-middle" />
            <div className="text-xl font-bold bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text font-pixel align-middle">
              Model Arena
            </div>
          </TrophyLocation>
        </div>
        <nav className="flex gap-8 items-center">
          <a href="/" className="text-gray-300 hover:text-[#00F2A9] transition-colors">
            Home
          </a>
          <a href="/about" className="text-gray-300 hover:text-[#00F2A9] transition-colors">
            About
          </a>
          <a href="/games" className="text-gray-300 hover:text-[#00F2A9] transition-colors">
            Games
          </a>
          <a href="#" className="text-gray-300 hover:text-[#00F2A9] transition-colors">
            Models
          </a>
          <Button className="glass-button px-6 py-2 text-white font-semibold hover:scale-105 transform transition-all duration-300 border-[#FF3CBD] hover:border-[#00F2A9] bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 hover:from-[#FF3CBD]/40 hover:to-[#00F2A9]/40 backdrop-blur-sm font-pixel">
            Get Started
          </Button>
        </nav>
      </header>

      {/* Content Container */}
      <div className="max-w-6xl mx-auto px-6 py-32">
        {/* Navigation */}
        <nav className="glass-effect-strong p-4 rounded-lg mb-12">
          <div className="flex justify-center gap-8">
            {['about', 'team', 'contribute'].map((section) => (
              <button
                key={section}
                onClick={() => {
                  setActiveSection(section);
                  playSound("click");
                }}
                className={`px-6 py-3 rounded-md transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${
                  activeSection === section
                    ? 'bg-gradient-to-r from-[#FF3CBD]/20 to-[#00F2A9]/20 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
                <TrophyCounter section={section} />
              </button>
            ))}
          </div>
        </nav>

        {/* About Section */}
        {activeSection === 'about' && (
          <div className="glass-effect-strong p-12 rounded-2xl backdrop-blur-2xl animate-fade-in">
            <h1 className="text-5xl font-bold mb-8 text-center font-pixel">
              <span className="text-[#00F2A9]">About</span>
              <span className="bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text"> Model Arena</span>
            </h1>
            <div className="space-y-8">
              <div className="glass-card p-8 rounded-xl transform hover:scale-102 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-[#FF3CBD] font-pixel">Our Journey</h2>
                <p className="text-gray-300 leading-relaxed">
                  Model Arena was founded by Pon Dinesh Kumar M with a vision to create a competitive yet educational AI arena. Unlike traditional benchmark platforms, Model Arena allows you to see your models in action, battling against others in real-time. Our motto "Build, Battle, Dominate" reflects our commitment to making AI development both fun and educational.
                </p>
                <TrophyLocation trophyId="funFact">
                  <div className="mt-4 flex items-center gap-2 text-[#00F2A9] cursor-pointer">
                    <span className="text-sm">Fun Fact:</span>
                    <span className="text-sm">You can even play against your own models!</span>
                  </div>
                </TrophyLocation>
              </div>

              {/* Timeline */}
              <div className="glass-card p-8 rounded-xl transform hover:scale-102 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-[#00F2A9] font-pixel">Our Timeline</h2>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF3CBD] to-[#00F2A9]"></div>
                  {timelineData.map((item, index) => (
                    <div 
                      key={index} 
                      className="relative pl-12 mb-8 last:mb-0 transform hover:scale-105 transition-all duration-300"
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="absolute left-0 w-8 h-8 rounded-full bg-[#FF3CBD] flex items-center justify-center transform -translate-x-1/2">
                        <span className="text-xl">{item.icon}</span>
                      </div>
                      <div className="text-[#FF3CBD] font-bold mb-1">{item.year}</div>
                      {item.event === "Project Launch" ? (
                        <TrophyLocation trophyId="timeline">
                          <div className="text-xl font-bold text-white mb-1 cursor-pointer">{item.event}</div>
                        </TrophyLocation>
                      ) : (
                        <div className="text-xl font-bold text-white mb-1">{item.event}</div>
                      )}
                      <div className="text-gray-300">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-8 rounded-xl transform hover:scale-102 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-[#00F2A9] font-pixel">Where We Are</h2>
                <p className="text-gray-300 leading-relaxed">
                  Currently, Model Arena features 2 exciting games with 2 game modes, allowing models to battle and learn from each other. Our platform is set to launch on June 1, 2025, with plans to expand rapidly. We're creating a space where AI enthusiasts can not only compare models but see them in action, making the learning process more engaging and practical.
                </p>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-[#FF3CBD]/10 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl font-bold text-[#FF3CBD]">{stats.models}+</div>
                    <div className="text-gray-400">Active Models</div>
                  </div>
                  <TrophyLocation trophyId="games">
                    <div className="text-center p-4 rounded-lg bg-[#00F2A9]/10 transform hover:scale-105 transition-all duration-300">
                      <div className="text-3xl font-bold text-[#00F2A9]">{stats.games}+</div>
                      <div className="text-gray-400">Games</div>
                    </div>
                  </TrophyLocation>
                  <div className="text-center p-4 rounded-lg bg-[#FF3CBD]/10 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl font-bold text-[#FF3CBD]">{stats.gamemodes}+</div>
                    <div className="text-gray-400">Game Modes</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-[#00F2A9]/10 transform hover:scale-105 transition-all duration-300">
                    <div className="text-3xl font-bold text-[#00F2A9]">{stats.contributors}</div>
                    <div className="text-gray-400">Contributors</div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-xl transform hover:scale-102 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-[#FF3CBD] font-pixel">Future Vision</h2>
                <p className="text-gray-300 leading-relaxed">
                  Looking ahead, we're excited to expand Model Arena with competitive tournaments, comprehensive leaderboards, and exciting challenges. We're working on integrating LLM/NLP models like ChatGPT, Claude, and Gemini to create even more diverse battle scenarios. Our goal is to make Model Arena the premier destination for AI model development, competition, and learning.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  {['Tournaments', 'Leaderboards', 'Challenges', 'LLM Integration'].map((feature, index) => (
                    feature === 'Challenges' ? (
                      <TrophyLocation key={index} trophyId="challenges">
                        <div className="px-4 py-2 rounded-full border border-[#FF3CBD]/20 text-[#00F2A9] text-sm transform hover:scale-110 transition-all duration-300">
                          {feature}
                        </div>
                      </TrophyLocation>
                    ) : (
                      <div key={index} className="px-4 py-2 rounded-full border border-[#FF3CBD]/20 text-[#00F2A9] text-sm transform hover:scale-110 transition-all duration-300">
                        {feature}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Section */}
        {activeSection === 'team' && (
          <div className="glass-effect-strong p-12 rounded-2xl backdrop-blur-2xl animate-fade-in">
            <h1 className="text-5xl font-bold mb-12 text-center font-pixel whitespace-nowrap flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text">
                The
              </span>
              <TrophyLocation trophyId="title">
                <span className="text-[#00F2A9]">Humans</span>
              </TrophyLocation>
              <span className="bg-gradient-to-r from-[#FF3CBD] to-[#FF85E9] text-transparent bg-clip-text">
                Behind Model Arena
              </span>
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <TrophyLocation key={index} trophyId={`member${index + 1}`}>
                  <div 
                    className="glass-card p-6 rounded-xl transform hover:scale-105 transition-all duration-300"
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="relative mb-6">
                      <div className="relative w-32 h-32 mx-auto">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className={`absolute inset-0 w-full h-full rounded-full border-2 border-[#FF3CBD] object-cover transition-opacity duration-500 ${
                            hoveredCard === index ? 'opacity-0' : 'opacity-100'
                          }`}
                        />
                        <img
                          src={member.hoverAvatar}
                          alt={`${member.name} fun`}
                          className={`absolute inset-0 w-full h-full rounded-full border-2 border-[#00F2A9] object-cover transition-opacity duration-500 ${
                            hoveredCard === index ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full glass-effect flex items-center justify-center">
                        <span className="text-2xl">{index + 1}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-[#FF3CBD] font-pixel whitespace-nowrap">{member.name}</h3>
                      <p className="text-sm font-pixel">
                        <span className="text-[#00F2A9]">aka </span>
                        <span className="text-[#FF3CBD]">{member.aka}</span>
                      </p>
                      <p className="text-[#00F2A9] font-pixel mt-1">{member.role}</p>
                    </div>
                    <p className="text-gray-300 mt-4 text-center">{member.bio}</p>
                    {hoveredCard === index && (
                      <div className="mt-4 text-sm text-[#FF3CBD] animate-fade-in text-center">
                        Fun Fact: {member.funFact}
                      </div>
                    )}
                    {spotlightMember === index && (
                      <div className="mt-4 animate-fade-in">
                        <h4 className="text-[#00F2A9] font-bold mb-2 text-center">Achievements:</h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {member.achievements.map((achievement, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-1 rounded-full bg-[#FF3CBD]/10 text-[#FF3CBD] text-sm transform hover:scale-110 transition-all duration-300 cursor-pointer"
                              onClick={() => {
                                playSound("achievement");
                                unlockAchievement(achievement);
                              }}
                            >
                              {achievement}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4">
                          <div className="text-[#00F2A9] font-bold mb-1 text-center">Level {member.level}</div>
                          <div className="w-full h-2 bg-[#FF3CBD]/20 rounded-full">
                            <div 
                              className="h-full bg-gradient-to-r from-[#FF3CBD] to-[#00F2A9] rounded-full"
                              style={{ width: `${(member.xp % 1000) / 10}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-400 mt-1 text-center">{member.xp} XP</div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-center gap-4 mt-4">
                      {Object.entries(member.socials).map(([platform, link]) => (
                        <a
                          key={platform}
                          href={link}
                          className="text-gray-400 hover:text-[#FF3CBD] transition-colors transform hover:scale-125"
                          onClick={() => playSound("social")}
                        >
                          <i className={`fab fa-${platform}`}></i>
                        </a>
                      ))}
                    </div>
                  </div>
                </TrophyLocation>
              ))}
            </div>
          </div>
        )}

        {/* Contribute Section */}
        {activeSection === 'contribute' && (
          <div className="glass-effect-strong p-12 rounded-2xl backdrop-blur-2xl animate-fade-in">
            <h1 className="text-5xl font-bold mb-12 text-center font-pixel">
              <span className="text-[#00F2A9]">Contribute</span>
              <span className="bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text"> to Model Arena</span>
            </h1>
            
            {/* Development Contribution Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {contributionSteps.map((step) => (
                <TrophyLocation key={step.step} trophyId={`step${step.step}`}>
                  <div className="glass-card p-8 rounded-xl transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full glass-effect flex items-center justify-center text-2xl transform group-hover:rotate-12 transition-transform duration-300">
                        {step.icon}
                      </div>
                      <div>
                        <span className="text-[#FF3CBD] font-pixel">Step {step.step}</span>
                        <h3 className="text-xl font-bold text-[#00F2A9] font-pixel">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{step.description}</p>
                    <div className="text-sm text-[#FF3CBD] opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-4">
                      {step.hoverText}
                    </div>
                    <div className="space-y-2">
                      {step.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <span className="text-[#00F2A9]">✓</span>
                          {benefit}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="text-[#00F2A9] font-bold mb-1">+{step.xp} XP</div>
                      <div className="w-full h-2 bg-[#FF3CBD]/20 rounded-full">
                        <div 
                          className="h-full bg-gradient-to-r from-[#FF3CBD] to-[#00F2A9] rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </TrophyLocation>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="glass-effect-strong py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-1">
              <img src="/logo.png" alt="Model Arena Logo" className="h-12 w-12 align-middle" />
              <div className="text-2xl font-bold bg-gradient-to-r from-[#FF3CBD] to-[#FF85E1] text-transparent bg-clip-text font-pixel align-middle">
                Model Arena
              </div>
            </div>
            <div className="flex gap-8">
              <a href="/" className="text-gray-400 hover:text-[#FF3CBD] transition-colors">
                Home
              </a>
              <a href="/about" className="text-gray-400 hover:text-[#FF3CBD] transition-colors">
                About
              </a>
              <a href="/games" className="text-gray-400 hover:text-[#FF3CBD] transition-colors">
                Games
              </a>
              <a href="#" className="text-gray-400 hover:text-[#FF3CBD] transition-colors">
                Models
              </a>
            </div>
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-[#FF3CBD]/20">
            <div className="text-gray-400">© 2024 Model Arena. All rights reserved.</div>
            <div className="flex gap-4">
              {['twitter', 'discord', 'github'].map((platform) => (
                <a key={platform} href="#" className="text-gray-400 hover:text-[#FF3CBD] transition-colors transform hover:scale-125">
                  <i className={`fab fa-${platform}`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Trophy Notification */}
      {showTrophyNotification && (
        <div className="fixed top-24 right-4 glass-effect-strong p-4 rounded-lg animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-2xl">🏆</span>
            <div>
              <div className="text-[#00F2A9] font-bold">New Trophy Unlocked!</div>
              <div className="text-gray-300">{newTrophy}</div>
              <div className="text-sm text-gray-400 mt-1">
                {collectedTrophies.filter(t => Object.keys(trophies[activeSection as keyof typeof trophies]).includes(t)).length}/
                {Object.keys(trophies[activeSection as keyof typeof trophies]).length} trophies collected
              </div>
            </div>
          </div>
        </div>
      )}
      <TrophyCase />
    </div>
  );
};

export default About; 