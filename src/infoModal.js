// Info Modal Content for Education Section
// Space-themed modal with unique content for each education entry

export const educationInfoContent = {
    westminster: {
      title: "University of Westminster",
      content: `
        <div class="modal-content-space">
          <h3 class="modal-title">🎓 University of Westminster</h3>
          <div class="modal-body">
            <p class="modal-text">Located in the heart of London, University of Westminster is one of the UK's leading universities for technology and engineering education.</p>
            
            <div class="info-section">
              <h4 class="info-subtitle">🌟 Key Highlights:</h4>
              <ul class="info-list">
                <li>BEng (Hons) Software Engineering</li>
                <li>First Class Honours Graduate</li>
                <li>London-based learning experience</li>
                <li>Industry-relevant curriculum</li>
                <li>Access to cutting-edge technology labs</li>
              </ul>
            </div>
            
            <div class="info-section">
              <h4 class="info-subtitle">🚀 Academic Journey:</h4>
              <p class="modal-text">Completed the final year of my Software Engineering degree at Westminster, focusing on advanced software development, project management, and real-world industry applications.</p>
            </div>
            
            <div class="info-section">
              <h4 class="info-subtitle">🌍 Location:</h4>
              <p class="modal-text">London, United Kingdom - A global tech hub providing exposure to international companies and diverse learning opportunities.</p>
            </div>
          </div>
        </div>
      `
    },
    
    iit: {
      title: "Informatics Institute of Technology",
      content: `
        <div class="modal-content-space">
          <h3 class="modal-title">🎓 Informatics Institute of Technology (IIT)</h3>
          <div class="modal-body">
            <p class="modal-text">Sri Lanka's premier private higher education institution, affiliated with the University of Westminster, specializing in computing and technology education.</p>
            
            <div class="info-section">
              <h4 class="info-subtitle">🌟 Key Highlights:</h4>
              <ul class="info-list">
                <li>BEng (Hons) Software Engineering</li>
                <li>Affiliated with University of Westminster</li>
                <li>First Class Honours Achievement</li>
                <li>Comprehensive 2-year program</li>
                <li>Industry-focused curriculum</li>
              </ul>
            </div>
            
            <div class="info-section">
              <h4 class="info-subtitle">🚀 Academic Journey:</h4>
              <p class="modal-text">Completed the first two years of my Software Engineering degree at IIT, building a strong foundation in programming, software design, and computer science fundamentals.</p>
            </div>
            
            <div class="info-section">
              <h4 class="info-subtitle">🌍 Location:</h4>
              <p class="modal-text">Colombo, Sri Lanka - A vibrant tech ecosystem with growing opportunities in software development and digital innovation.</p>
            </div>
          </div>
        </div>
      `
    },
    
    stc: {
      title: "S. Thomas' College",
      content: `
        <div class="modal-content-space">
          <h3 class="modal-title">🎓 S. Thomas' College, Mount Lavinia</h3>
          <div class="modal-body">
            <p class="modal-text">One of Sri Lanka's most prestigious schools, known for academic excellence and producing leaders in various fields including technology and engineering.</p>
            
            <div class="info-section">
              <h4 class="info-subtitle">🌟 Academic Achievements:</h4>
              <ul class="info-list">
                <li>GCE Advanced Level (A/L) - Physical Science Stream</li>
                <li>Grades: A, 2C (2018-2020)</li>
                <li>GCE Ordinary Level (O/L)</li>
                <li>Grades: 8A, 1B (2007-2017)</li>
                <li>Strong foundation in Mathematics & Science</li>
              </ul>
            </div>
            
            <div class="info-section">
              <h4 class="info-subtitle">🚀 Educational Foundation:</h4>
              <p class="modal-text">Built a solid academic foundation in mathematics, physics, and chemistry during A/Ls, which provided the perfect groundwork for pursuing software engineering at university level.</p>
            </div>
            
            <div class="info-section">
              <h4 class="info-subtitle">🌍 Location:</h4>
              <p class="modal-text">Mount Lavinia, Sri Lanka - A historic coastal town known for its educational institutions and cultural heritage.</p>
            </div>
          </div>
        </div>
      `
    }
  };
  
// Project info content
export const projectInfoContent = {
  proj_concurrent: {
    title: "Concurrent Ticketing System",
    content: `
      <div class="modal-content-space">
        <h3 class="modal-title">Concurrent Ticketing System</h3>
        <div class="modal-body">
          <p class="modal-text">Dec 2023 - Jan 2024</p>
          <p class="modal-text">Associated with University of Westminster</p>
          <p class="modal-text">Built a multithreaded Java system that simulates passengers and technicians interacting with a shared Ticket Machine. The design was specified in FSP and validated with LTSA, then implemented with Java monitors and thread groups to guarantee safe access to shared resources (paper/toner).</p>
          <div class="info-section">
            <h4 class="info-subtitle">Key Features</h4>
            <ul class="info-list">
              <li>Modeled the system using FSP and verified the design using the LTSA tool.</li>
              <li>Implemented multi-threading with thread groups and monitors for synchronization.</li>
              <li>Simulated real-world scenarios like resource exhaustion and replenishment with random delays.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">What I learned</h4>
            <ul class="info-list">
              <li>Practical Java concurrency (synchronization, deadlock avoidance).</li>
              <li>End‑to‑end workflow from formal models (FSP) to implementation.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Achievements & Repository</h4>
            <ul class="info-list">
              <li>Grade: 97/100</li>
              <li><a href="https://github.com/AkshayanMohandas/Concurrent-Ticketing-System" target="_blank" rel="noopener noreferrer" id="static-site-link">Concurrent Ticketing System (GitHub)</a></li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Skills</h4>
            <ul class="info-list">
              <li>Java · Java Software Development · Concurrent Programming · Java Concurrency · Object-Oriented Programming (OOP) · IntelliJ IDEA · Multithreading · Problem Solving</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  proj_asteroids: {
    title: "Old Asteroids Arcade Game (Formal Specification)",
    content: `
      <div class="modal-content-space">
        <h3 class="modal-title">Old Asteroids Arcade Game (Formal Specification)</h3>
        <div class="modal-body">
          <p class="modal-text">Dec 2023 - Jan 2024</p>
          <p class="modal-text">Associated with University of Westminster</p>
          <p class="modal-text">Formal B-Method specification of a simplified Asteroids game. Verified with Atelier B and ProB to ensure safe grid navigation, collision handling, and energy constraints.</p>
          <div class="info-section">
            <h4 class="info-subtitle">Scope</h4>
            <ul class="info-list">
              <li>Models for space, spaceship, obstacles, and operations (move, warp, status).</li>
              <li>Proof obligations and simulations to validate correctness.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">What I learned</h4>
            <ul class="info-list">
              <li>Specification writing and representing problems in mathematically precise terms.</li>
              <li>Verification and validation to ensure logical correctness and adherence to constraints.</li>
              <li>Tool proficiency with Atelier B and ProB for verification and animation.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Achievements & Repository</h4>
            <ul class="info-list">
              <li>Grade: 97/100</li>
              <li><a href="https://github.com/AkshayanMohandas/Old-Asteroids-Arcade-Game" target="_blank" rel="noopener noreferrer" id="static-site-link">GitHub - Formal Specification of a Simplified Asteroids Arcade Game</a></li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Skills</h4>
            <ul class="info-list">
              <li>Formal Methods · Graphs · B specification · Atelier B · ProB · Problem Solving · Coding Experience</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  proj_weather: {
    title: "Weather Explorer & Tourist Guide App (SwiftUI)",
    content: `
      <div class="modal-content-space">
        <h3 class="modal-title">Weather Explorer & Tourist Guide App (SwiftUI)</h3>
        <div class="modal-body">
          <p class="modal-text">Nov 2023 - Jan 2024</p>
          <p class="modal-text">Associated with University of Westminster</p>
          <p class="modal-text">SwiftUI iOS app that combines OpenWeatherMap forecasts with CoreLocation/MapKit to show real‑time weather and nearby tourist POIs. Users can search cities, see current/hourly/daily data, and browse attractions on an interactive map.</p>
          <div class="info-section">
            <h4 class="info-subtitle">Key Features</h4>
            <ul class="info-list">
              <li>Real-time weather updates: Display current conditions, hourly and daily forecasts for any location.</li>
              <li>Tourist Places Map: Interactive map with annotated pins for key tourist attractions, dynamically loaded from local JSON data.</li>
              <li>Dynamic Location Management: User-input-driven city updates reflected across all views (weather, forecast, and POIs).</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">What I learned</h4>
            <ul class="info-list">
              <li>SwiftUI patterns, CoreLocation/MapKit integration, async API handling.</li>
              <li>Performance tuning and HIG‑aligned UI design.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Achievements & Repository</h4>
            <ul class="info-list">
              <li>Grade: 86/100</li>
              <li><a href="https://github.com/AkshayanMohandas/Tourist-Utility-App" target="_blank" rel="noopener noreferrer" id="static-site-link">GitHub Repository: Weather Explorer & Tourist Guide App</a></li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Skills</h4>
            <ul class="info-list">
              <li>Swift · SwiftUI · Xcode · iOS · JSON · APIs · Problem Solving · Coding Experience</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  proj_sliding: {
    title: "Sliding Puzzles – Graph Acyclicity Checker",
    content: `
      <div class="modal-content-space">
        <h3 class="modal-title">Sliding Puzzles – Graph Acyclicity Checker</h3>
        <div class="modal-body">
          <p class="modal-text">Apr 2023 - May 2023</p>
          <p class="modal-text">Associated with Informatics Institute of Technology (IIT Campus)</p>
          <p class="modal-text">During my (BEng) in Software Engineering at Informatics Institute of Technology (IIT), Sri Lanka, I developed an advanced Graph Acyclicity Checker as part of my coursework. This project implements the sink elimination algorithm to determine if a directed graph is acyclic, along with a feature to detect cycles in cyclic graphs.</p>
          <div class="info-section">
            <h4 class="info-subtitle">Key aspects</h4>
            <ul class="info-list">
              <li>Algorithm Design: Iteratively removes sink vertices to confirm acyclicity.</li>
              <li>Data Structures: Directed graphs via adjacency lists for performance.</li>
              <li>File Parsing: Reads graph data from text files for dynamic inputs.</li>
              <li>Cycle Detection: Identifies and prints detected cycles in non-acyclic graphs.</li>
              <li>Performance Measurement: Time complexity analysis with empirical testing.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Skills</h4>
            <ul class="info-list">
              <li>Java · Algorithms · Algorithm Development · IntelliJ IDEA · Graphs · Coding Experience · Problem Solving</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Achievements & Repository</h4>
            <ul class="info-list">
              <li>Grade: 88/100</li>
              <li><a href="https://github.com/AkshayanMohandas/Slinding-Puzzles" target="_blank" rel="noopener noreferrer" id="static-site-link">GitHub - Slinding puzzles</a></li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  proj_skin: {
    title: "Skin Consultation Management System",
    content: `
      <div class="modal-content-space">
        <h3 class="modal-title">Skin Consultation Management System</h3>
        <div class="modal-body">
          <p class="modal-text">Oct 2022 - Jan 2023</p>
          <p class="modal-text">Associated with Informatics Institute of Technology (IIT Campus)</p>
          <p class="modal-text">Java system (console + Swing GUI) to manage dermatology doctors, patients, and consultations with persistent storage and encrypted records.</p>
          <div class="info-section">
            <h4 class="info-subtitle">The project includes</h4>
            <ul class="info-list">
              <li>Doctor management with detailed profiles and specializations.</li>
              <li>Consultation booking, modification, and cancellation with availability checks.</li>
              <li>Data persisted and reloaded across sessions using file storage.</li>
              <li>Intuitive Swing GUI for viewing doctor details and booking consultations.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Tech & Skills</h4>
            <ul class="info-list">
              <li>Java (Swing), UML, File I/O, Encryption, Unit Testing, OOP design.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Repository</h4>
            <ul class="info-list">
              <li><a href="https://github.com/AkshayanMohandas/Skin-Consultation-Centre" target="_blank" rel="noopener noreferrer" id="static-site-link">GitHub Repository</a></li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  proj_cruise: {
    title: "Cruise Ship Boarding System",
    content: `
      <div class="modal-content-space">
        <h3 class="modal-title">Cruise Ship Boarding System</h3>
        <div class="modal-body">
          <p class="modal-text">Mar 2022 - Apr 2022</p>
          <p class="modal-text">Associated with Informatics Institute of Technology (IIT Campus)</p>
          <p class="modal-text">Java console app for managing cruise ship cabins and passengers via a menu‑driven workflow.</p>
          <div class="info-section">
            <h4 class="info-subtitle">Key features</h4>
            <ul class="info-list">
              <li>Cabin CRUD, alphabetical sorting and search.</li>
              <li>File save/load and passenger expense tracking.</li>
              <li>Overflow handling with a circular queue.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Repository</h4>
            <ul class="info-list">
              <li><a href="https://github.com/AkshayanMohandas/Boarding-System-For-A-CruiseShip" target="_blank" rel="noopener noreferrer" id="static-site-link">GitHub - Boarding System For A CruiseShip</a></li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Skills</h4>
            <ul class="info-list">
              <li>Java Software Development · Usability Testing · DBMS · IntelliJ IDEA · Critical Thinking · Problem Solving</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  proj_tripper: {
    title: "Tripper – A Tourism Website",
    content: `
      <div class="modal-content-space">
        <h3 class="modal-title">Tripper – A Tourism Website</h3>
        <div class="modal-body">
          <p class="modal-text">Feb 2022 - Mar 2022</p>
          <p class="modal-text">Associated with Informatics Institute of Technology (IIT Campus)</p>
          <p class="modal-text">Team‑built tourism site letting users explore destinations, and purchase travel‑related products. Built with HTML/CSS/JS and modern front‑end practices.</p>
          <div class="info-section">
            <h4 class="info-subtitle">Key Features</h4>
            <ul class="info-list">
              <li>Home Page and Presentation/Index Page for onboarding and navigation.</li>
              <li>Buy Products Page to purchase travel-related items.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">My Role</h4>
            <ul class="info-list">
              <li>Presentation/Index, Home, and Buy Products pages.</li>
              <li>Responsive UI/UX implementation.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Achievements & Repository</h4>
            <ul class="info-list">
              <li>Achievement: 95/100</li>
              <li><a href="https://github.com/AkshayanMohandas/TRIPPER" target="_blank" rel="noopener noreferrer" id="static-site-link">GitHub Repository: Tripper</a></li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Skills</h4>
            <ul class="info-list">
              <li>Web Application Development · HTML · CSS · JavaScript · VS Code · Teamwork · Problem Solving · Report Writing</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  proj_progression: {
    title: "Student Progression Outcome Prediction System",
    content: `
      <div class="modal-content-space">
        <h3 class="modal-title">Student Progression Outcome Prediction System</h3>
        <div class="modal-body">
          <p class="modal-text">Nov 2021 - Dec 2021</p>
          <p class="modal-text">Associated with Informatics Institute of Technology (IIT Campus)</p>
          <p class="modal-text">Python tool to determine student outcomes from Pass/Defer/Fail credits, with strong input validation and histogram summaries.</p>
          <div class="info-section">
            <h4 class="info-subtitle">Key functionalities</h4>
            <ul class="info-list">
              <li>Input validation and total credit checks.</li>
              <li>Automated outcome calculation per academic rules.</li>
              <li>Horizontal and vertical histogram generation.</li>
              <li>Data storage and retrieval from dictionaries and text files.</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Skills</h4>
            <ul class="info-list">
              <li>Python · Problem Solving · Software Development · Algorithm Analysis · Data Management</li>
            </ul>
          </div>
          <div class="info-section">
            <h4 class="info-subtitle">Repository</h4>
            <ul class="info-list">
              <li><a href="https://github.com/AkshayanMohandas/Student-Progression-Outcome-Prediction-System" target="_blank" rel="noopener noreferrer" id="static-site-link">GitHub - Student Progression Outcome Prediction System</a></li>
            </ul>
          </div>
        </div>
      </div>
    `
  }
};

  // Modal functionality
  export function createInfoModal() {
    // Create modal HTML structure
    const modalHTML = `
      <div id="infoModal" class="info-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-container">
          <div class="modal-header">
            <button class="modal-close" id="modalClose">&times;</button>
          </div>
          <div class="modal-content" id="modalContent">
            <!-- Content will be dynamically inserted here -->
          </div>
        </div>
      </div>
    `;
    
    // Add modal to body if it doesn't exist
    if (!document.getElementById('infoModal')) {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Add event listeners
    setupModalEventListeners();
  }
  
  function setupModalEventListeners() {
    const modal = document.getElementById('infoModal');
    const closeBtn = document.getElementById('modalClose');
    const backdrop = modal.querySelector('.modal-backdrop');
    
    // Close modal when clicking close button
    closeBtn.addEventListener('click', closeModal);
    // Improve accessibility and click handling
    closeBtn.setAttribute('aria-label', 'Close modal');
    closeBtn.setAttribute('type', 'button');
    closeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeModal();
      }
    });
    
    // Close modal when clicking backdrop
    backdrop.addEventListener('click', closeModal);
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
      }
    });
  }
  
export function openModal(contentKey) {
    const modal = document.getElementById('infoModal');
    const modalContent = document.getElementById('modalContent');
    
  const registry = { ...educationInfoContent, ...projectInfoContent };

  if (registry[contentKey]) {
    modalContent.innerHTML = registry[contentKey].content;
      modal.style.display = 'block';
      
      // Add entrance animation
      setTimeout(() => {
        modal.classList.add('modal-show');
      }, 10);
    }
  }
  
  function closeModal() {
    const modal = document.getElementById('infoModal');
    modal.classList.remove('modal-show');
    
    // Hide modal after animation
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }