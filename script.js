// script.js - Logical interactions for GEODNET Developer Portal

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initNetworkMap();
  initApiExplorer();
  initKnowledgeBase();
  initCopyToClipboard();
  initEnterpriseConsole();
  initOnboardingForm();
});

// 1. Navigation / SPA routing
function initNavigation() {
  const menuLinks = document.querySelectorAll('.sidebar-menu .menu-item a');
  const sections = document.querySelectorAll('.main-content .section');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  // Page switching logic
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      
      // Update active links
      document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
        item.classList.remove('active');
      });
      link.parentElement.classList.add('active');

      // Update active sections
      sections.forEach(sec => {
        sec.classList.remove('active');
        if (sec.id === targetId) {
          sec.classList.add('active');
        }
      });

      // Close mobile sidebar if open
      if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
      
      // Scroll to top
      window.scrollTo(0, 0);
    });
  });

  // Mobile menu toggle
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Close sidebar on clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    }
  });
}

// 2. Interactive Network Map (Canvas-based simulation)
function initNetworkMap() {
  const container = document.getElementById('network-map-canvas-container');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  
  // Resize handler
  window.addEventListener('resize', () => {
    if (container.clientWidth > 0) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  });

  // Generate stations
  const stations = [];
  const count = 38;
  const statusOptions = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ONLINE', 'ONLINE', 'OFFLINE'];
  const regions = ['USA', 'CAN', 'GBR', 'DEU', 'FRA', 'IND', 'ROU', 'TUR', 'MYS', 'THA'];

  for (let i = 0; i < count; i++) {
    stations.push({
      id: `G${100 + i}`,
      mountpoint: `C05D898${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`,
      x: 50 + Math.random() * (canvas.width - 100),
      y: 50 + Math.random() * (canvas.height - 100),
      region: regions[Math.floor(Math.random() * regions.length)],
      lat: (30 + Math.random() * 30).toFixed(4),
      lon: (-120 + Math.random() * 180).toFixed(4),
      status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
      pulseRadius: 0,
      pulseSpeed: 0.2 + Math.random() * 0.4
    });
  }

  let hoveredStation = null;

  // Mouse move check
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    for (const st of stations) {
      const dist = Math.hypot(st.x - mx, st.y - my);
      if (dist < 10) {
        found = st;
        break;
      }
    }
    hoveredStation = found;
    canvas.style.cursor = hoveredStation ? 'pointer' : 'default';
  });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grids
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw connections between close stations (mesh layout)
    ctx.lineWidth = 0.5;
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const dist = Math.hypot(stations[i].x - stations[j].x, stations[i].y - stations[j].y);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.08;
          ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(stations[i].x, stations[i].y);
          ctx.lineTo(stations[j].x, stations[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw stations and pulses
    stations.forEach(st => {
      let color = '#10b981'; // ACTIVE
      if (st.status === 'ONLINE') color = '#fbbf24'; // ONLINE
      if (st.status === 'OFFLINE') color = '#ef4444'; // OFFLINE

      // Pulse
      if (st.status !== 'OFFLINE') {
        st.pulseRadius += st.pulseSpeed;
        if (st.pulseRadius > 20) st.pulseRadius = 0;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.pulseRadius, 0, Math.PI * 2);
        ctx.globalAlpha = 1 - st.pulseRadius / 20;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Center dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(st.x, st.y, hoveredStation === st ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(st.x, st.y, hoveredStation === st ? 8 : 5, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw tooltip if hovered
    if (hoveredStation) {
      const tooltipW = 180;
      const tooltipH = 95;
      let tx = hoveredStation.x + 15;
      let ty = hoveredStation.y - 15;

      // Adjust boundaries
      if (tx + tooltipW > canvas.width) tx = hoveredStation.x - tooltipW - 15;
      if (ty + tooltipH > canvas.height) ty = canvas.height - tooltipH - 10;
      if (ty < 10) ty = 10;

      // Card background
      ctx.fillStyle = 'rgba(11, 21, 40, 0.95)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tooltipW, tooltipH, 8);
      ctx.fill();
      ctx.stroke();

      // Content text
      ctx.font = 'bold 12px "Outfit"';
      ctx.fillStyle = 'white';
      ctx.fillText(`Mount: ${hoveredStation.mountpoint}`, tx + 12, ty + 22);

      ctx.font = '10px "Outfit"';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`Region: ${hoveredStation.region}`, tx + 12, ty + 40);
      ctx.fillText(`Coords: ${hoveredStation.lat}° N, ${hoveredStation.lon}° E`, tx + 12, ty + 55);

      // Status Badge
      let statusColor = '#10b981';
      if (hoveredStation.status === 'ONLINE') statusColor = '#fbbf24';
      if (hoveredStation.status === 'OFFLINE') statusColor = '#ef4444';

      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(tx + 17, ty + 75, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 9px "Outfit"';
      ctx.fillStyle = statusColor;
      ctx.fillText(hoveredStation.status, tx + 26, ty + 78);
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// 3. API Explorer & Sandbox
function initApiExplorer() {
  const apiButtons = document.querySelectorAll('.api-nav-btn');
  const apiEndpointUrl = document.getElementById('api-endpoint-url-text');
  const apiMethodBadge = document.getElementById('api-method-badge');
  const apiTitle = document.getElementById('api-explorer-title');
  const apiDesc = document.getElementById('api-explorer-desc');
  const paramListBody = document.getElementById('param-list-body');
  const consoleContent = document.getElementById('console-output-content');
  const sendBtn = document.getElementById('api-send-btn');
  
  // Endpoint definitions
  const endpoints = {
    mountpoints: {
      title: 'Get Mountpoint List',
      desc: 'Retrieves the list of all available RTCM mountpoints matching the customer authorizations.',
      method: 'GET',
      url: 'https://rawdata.geodnet.com/api/rawdata/v1/mountpoints',
      params: [],
      mockResponse: {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString(),
          'Server': 'geodnet-api-server'
        },
        body: {
          code: 1000,
          msg: 'OK',
          data: ['C05D898D74F9', '8813BF5CEE5D', 'A0B7651E1A5D', 'C05D898D0E51', 'AC1518EDCC51']
        }
      }
    },
    add: {
      title: 'Add Station',
      desc: 'Authorizes and adds a new station to the customer account list.',
      method: 'POST',
      url: 'https://rawdata.geodnet.com/api/rawdata/v1/add',
      params: [
        { name: 'mountpoint', type: 'string', required: true, desc: 'The base station mountpoint ID to add.', default: 'AC1518EDCC51' }
      ],
      mockResponse: {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString(),
          'Server': 'geodnet-api-server'
        },
        body: {
          code: 1000,
          msg: 'OK'
        }
      }
    },
    replace: {
      title: 'Replace Mountpoint',
      desc: 'Replaces an existing authorized mountpoint with a new target mountpoint. Note: Authorized stations cannot be deleted, only replaced.',
      method: 'POST',
      url: 'https://rawdata.geodnet.com/api/rawdata/v1/replacement',
      params: [
        { name: 'original', type: 'string', required: true, desc: 'The mountpoint to be replaced.', default: 'C05D898D74F9' },
        { name: 'target', type: 'string', required: true, desc: 'The target replacement mountpoint.', default: '8813BF5CEE5D' }
      ],
      mockResponse: {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString(),
          'Server': 'geodnet-api-server'
        },
        body: {
          code: 1000,
          msg: 'OK'
        }
      }
    },
    coordinates: {
      title: 'Get Station Coordinates',
      desc: 'Fetches the precise coordinates (ITRF2020) for all base stations in the client pool.',
      method: 'GET',
      url: 'https://rawdata.geodnet.com/api/rawdata/v1/coordinates',
      params: [],
      mockResponse: {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString(),
          'Server': 'geodnet-api-server'
        },
        body: {
          code: 1000,
          msg: 'OK',
          data: [
            { mountpoint: 'C05D898D74F9', lat: 34.980122, lon: -79.071143, alt: 114.38 },
            { mountpoint: '8813BF5CEE5D', lat: 12.971291, lon: 77.761434, alt: 920.45 }
          ]
        }
      }
    },
    stations: {
      title: 'Get Stations List',
      desc: 'Retrieves all stations assigned to the user account, including status and metadata.',
      method: 'GET',
      url: 'https://rawdata.geodnet.com/api/rawdata/v1/stations',
      params: [],
      mockResponse: {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString(),
          'Server': 'geodnet-api-server'
        },
        body: {
          code: 1000,
          msg: 'OK',
          data: [
            { mountpoint: 'C05D898D74F9', region: 'USA', lat: 34.98, lon: -79.07, status: 'ACTIVE', time: '2026-07-02T23:00:00Z' },
            { mountpoint: '8813BF5CEE5D', region: 'IND', lat: 12.97, lon: 77.76, status: 'ONLINE', time: '2026-07-02T23:15:00Z' }
          ]
        }
      }
    },
    info: {
      title: 'Get Specific Station Info',
      desc: 'Query detailed coordinates and status indicators of a specific base station in the network.',
      method: 'POST',
      url: 'https://rawdata.geodnet.com/api/rawdata/v1/station',
      params: [
        { name: 'mountpoint', type: 'string', required: true, desc: 'The mountpoint to query.', default: 'C05D898D74F9' }
      ],
      mockResponse: {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString(),
          'Server': 'geodnet-api-server'
        },
        body: {
          code: 1000,
          msg: 'OK',
          data: {
            mountpoint: 'C05D898D74F9',
            region: 'USA',
            lat: 34.98012249,
            lon: -79.07114343,
            elHeight: 114.3865,
            status: 'ACTIVE',
            time: '2026-07-02T23:59:18Z'
          }
        }
      }
    },
    qcHourly: {
      title: 'Get Hourly QC Data',
      desc: 'Retrieves quality control metrics (multipath, data availability, cycle slips) by hour. Maximum history query limit is 30 days.',
      method: 'POST',
      url: 'https://rawdata.geodnet.com/api/rawdata/v1/qc/hourly',
      params: [
        { name: 'station', type: 'string', required: true, desc: 'Full station mountpoint name.', default: 'C05D898D74F9' },
        { name: 'startTime', type: 'number', required: true, desc: 'Unix timestamp in milliseconds for start range.', default: Date.now() - 3600000 * 24 },
        { name: 'endTime', type: 'number', required: true, desc: 'Unix timestamp in milliseconds for end range.', default: Date.now() }
      ],
      mockResponse: {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString(),
          'Server': 'geodnet-api-server'
        },
        body: {
          code: 1000,
          msg: 'OK',
          data: [
            {
              station: 'C05D898D74F9',
              date: '2026-07-02',
              hour: 22,
              availability: 99.95,
              iodSlips: 12,
              mpSlips: 24,
              mp12: 0.1245,
              mp21: 0.1584,
              oSlps: 12840,
              receiver: 'UM980RA-10B'
            }
          ]
        }
      }
    },
    qcStation: {
      title: 'Get Station QC Metrics',
      desc: 'Retrieves average quality control performance values (multipath, coordinates stability, availability) for a base station.',
      method: 'POST',
      url: 'https://rawdata.geodnet.com/api/rawdata/v1/qc/station',
      params: [
        { name: 'station', type: 'string', required: true, desc: 'Mountpoint name of the station.', default: 'C05D898D74F9' }
      ],
      mockResponse: {
        headers: {
          'Content-Type': 'application/json',
          'Date': new Date().toUTCString(),
          'Server': 'geodnet-api-server'
        },
        body: {
          code: 1000,
          msg: 'OK',
          data: {
            station: 'C05D898D74F9',
            availability: 99.88,
            mp12: 0.1171,
            mp21: 0.1699,
            mp15: 0.1633,
            mp51: 0.2074,
            oSlps: 14603
          }
        }
      }
    }
  };

  let activeEndpointKey = 'mountpoints';

  // Toggle active endpoint in Explorer
  apiButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      apiButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      activeEndpointKey = btn.dataset.endpoint;
      renderEndpointDetails(activeEndpointKey);
    });
  });

  function renderEndpointDetails(key) {
    const end = endpoints[key];
    if (!end) return;
    
    // Update path, method, headers
    apiEndpointUrl.textContent = end.url;
    apiMethodBadge.textContent = end.method;
    apiMethodBadge.className = `method method-${end.method.toLowerCase()}`;
    apiTitle.textContent = end.title;
    apiDesc.textContent = end.desc;
    
    // Reset console
    consoleContent.textContent = '// Click "Run Request" to execute API call';
    consoleContent.style.color = '#6b7280';

    // Clear parameters table
    paramListBody.innerHTML = '';
    
    if (end.params.length === 0) {
      paramListBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 1.5rem;">No parameters required for this endpoint.</td></tr>`;
      return;
    }

    // Render parameters inputs
    end.params.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="param-name">${p.name}${p.required ? '<span class="param-required">*</span>' : ''}</td>
        <td class="param-type">${p.type}</td>
        <td><input type="text" class="param-input" data-param="${p.name}" value="${p.default}"></td>
        <td class="param-desc">${p.desc}</td>
      `;
      paramListBody.appendChild(tr);
    });
  }

  // Handle run request
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      consoleContent.style.color = '#38bdf8';
      consoleContent.textContent = 'HTTP/1.1 Sending Request...\n';
      
      const end = endpoints[activeEndpointKey];
      
      // Read params values
      const payload = {};
      const inputs = paramListBody.querySelectorAll('.param-input');
      inputs.forEach(input => {
        const val = input.value;
        const name = input.dataset.param;
        payload[name] = isNaN(val) ? val : Number(val);
      });

      // Construct Mock HTTP Request Details
      let reqStr = `> ${end.method} ${end.url.replace('https://rawdata.geodnet.com', '')} HTTP/1.1\n`;
      reqStr += `> Host: rawdata.geodnet.com\n`;
      reqStr += `> Authorization: Basic [base64_encoded_credentials]\n`;
      if (end.method === 'POST') {
        reqStr += `> Content-Type: application/json\n`;
        reqStr += `> Content-Length: ${JSON.stringify(payload).length}\n`;
        reqStr += `>\n`;
        reqStr += `> ${JSON.stringify(payload, null, 2)}\n`;
      }
      reqStr += `\n< HTTP/1.1 200 OK\n`;
      
      // Render Headers
      for (const [hk, hv] of Object.entries(end.mockResponse.headers)) {
        reqStr += `< ${hk}: ${hv}\n`;
      }
      reqStr += `<\n`;

      // Typewriter-like simulated output
      setTimeout(() => {
        consoleContent.textContent = reqStr + JSON.stringify(end.mockResponse.body, null, 2);
      }, 500);
    });
  }

  // Initialize first load
  renderEndpointDetails('mountpoints');
}

// 4. Knowledge Base Search & Modal Dialogs
function initKnowledgeBase() {
  const searchInput = document.getElementById('kb-search');
  const cards = document.querySelectorAll('.kb-grid .kb-card');
  const modal = document.getElementById('kb-modal');
  const modalClose = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  // KB Full Detailed Content definitions
  const kbDetails = {
    gnss: {
      title: 'GNSS: Global Navigation Satellite Systems',
      html: `
        <h3>Technology Overview</h3>
        <p>Global Navigation Satellite Systems (GNSS) is the standard generic term for satellite navigation systems that provide autonomous geo-spatial positioning with global coverage. GNSS allows small electronic receivers to determine their location (longitude, latitude, and altitude) to within a few meters using time signals transmitted along a line of sight by radio from satellites.</p>
        <h3>Core Constellations</h3>
        <ul>
          <li><strong>GPS (USA)</strong>: The Global Positioning System operates with 31+ operational satellites in medium Earth orbit, transmitting signals on frequencies such as L1, L2, and L5.</li>
          <li><strong>GLONASS (Russia)</strong>: Global Navigation Satellite System, using Frequency Division Multiple Access (FDMA) and CDMA signals in orbit.</li>
          <li><strong>Galileo (Europe)</strong>: Highly accurate civilian satellite navigation system using E1, E5a, E5b, and E6 signals.</li>
          <li><strong>BeiDou (China)</strong>: BDS operates triple-band constellations transmitting signals on B1I, B2I, B3I, B1C, and B2a.</li>
        </ul>
        <h3>Multi-Frequency Advantages</h3>
        <p>Modern GNSS base stations (like those in the GEODNET network) capture triple-frequency signals. Dual or triple frequency receivers allow the cancellation of ionospheric delay, which is the largest source of error in single-frequency GPS calculations. This is critical for centimeter-level accuracy algorithms like RTK and PPP.</p>
      `
    },
    rtk: {
      title: 'RTK: Real-Time Kinematic Positioning',
      html: `
        <h3>Centimeter Precision in Real-Time</h3>
        <p>Real-Time Kinematic (RTK) is a satellite navigation technique used to enhance the precision of position data derived from satellite-based positioning systems. It uses measurements of the phase of the satellite's carrier wave, rather than the information content of the signal, and relies on a single reference station or interpolated virtual station to provide real-time corrections.</p>
        <h3>Core Mathematics: Double-Differencing</h3>
        <p>RTK eliminates common-mode errors (such as receiver clock bias, satellite clock bias, satellite orbit errors, and atmospheric delays) by calculating differences between carrier phase measurements. Double-differencing subtracts measurements between two receivers (rover and base) and two satellites:</p>
        <p style="font-family: var(--font-mono); background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 6px; margin: 1rem 0;">
          ∇ΔΦ = (Φ_rover^sat1 - Φ_base^sat1) - (Φ_rover^sat2 - Φ_base^sat2)
        </p>
        <p>This differential calculation leaves carrier phase integer ambiguities, which are resolved in real-time (RTK Float to RTK Fix) to secure centimeter positioning. Single-base RTK typically has a range limit of 30km due to atmospheric spatial decorrelation.</p>
      `
    },
    vrs: {
      title: 'VRS: Virtual Reference Station Networking',
      html: `
        <h3>Scaling RTK Beyond 30km</h3>
        <p>Virtual Reference Station (VRS) is a network-based method that extends differential high-precision RTK positioning to regional scales. In a standard RTK setup, accuracy decreases by approximately 1 ppm (1 mm per km) as the distance from the base station increases due to atmospheric differences between base and rover locations.</p>
        <h3>How VRS Works</h3>
        <ul>
          <li><strong>Data Collection</strong>: A network of physical base stations continuously streams raw GNSS measurements to a central network processing server.</li>
          <li><strong>Rover Position Submission</strong>: The rover connects to the caster and uploads its approximate coordinate using a standard NMEA-183 GGA string.</li>
          <li><strong>Virtual Base Synthesis</strong>: The central processing software models the atmospheric errors (Ionosphere and Troposphere) across the network and generates a synthetic "Virtual Reference Station" located just meters from the rover's reported position.</li>
          <li><strong>Correction Streaming</strong>: The server streams standard RTCM corrections to the rover relative to this virtual base coordinates, enabling short-baseline RTK performance (&lt;15s initialization) anywhere within the network grid.</li>
        </ul>
      `
    },
    ppp: {
      title: 'PPP: Precise Point Positioning',
      html: `
        <h3>Decentralized Global Precision</h3>
        <p>Precise Point Positioning (PPP) is a positioning method that calculates centimeter-level coordinates globally without reference stations in the immediate vicinity. Instead of differential measurements, PPP combines raw carrier phase observations from a single receiver with highly accurate satellite orbit and clock corrections, usually broadcasted via L-band satellites or internet streams.</p>
        <h3>NRCAN PPP Service</h3>
        <p>The Canadian Spatial Reference System (CSRS) PPP service developed by NRCAN (Natural Resources Canada) is one of the industry-leading PPP processing engines. GEODNET utilizes the NRCAN PPP service to determine and continuously monitor the absolute global coordinate of its base stations in the ITRF2020 reference frame. This ensures that the baseline coordinates used for downstream RTK corrections are accurate to the sub-centimeter level relative to the earth crust rotation.</p>
      `
    },
    rtcm: {
      title: 'RTCM: Messaging Protocols & Formats',
      html: `
        <h3>Standardizing Positioning Streams</h3>
        <p>RTCM (Radio Technical Commission for Maritime Services) Special Committee 104 defines the standard data formats for differential GNSS corrections. GEODNET streams corrections using the <strong>RTCM 3.2</strong> standard, which introduces <strong>Multiple Signal Messages (MSM)</strong>.</p>
        <h3>MSM4 Message Configurations</h3>
        <p>RTCM MSM defines 7 types of messages (MSM1 to MSM7) ranging from basic pseudorange data to full high-resolution pseudorange, carrier phase, Doppler, and signal-to-noise ratio (SNR) details. GEODNET broadcasts MSM4 messages which are ideal for consumer and survey-grade multi-constellation RTK receivers:</p>
        <ul>
          <li><strong>RTCM 1005</strong>: Stationary Antenna Reference Point coordinates (ECEF coordinates).</li>
          <li><strong>RTCM 1033</strong>: Receiver and Antenna description metadata.</li>
          <li><strong>RTCM 1074</strong>: GPS MSM4 carrier signals.</li>
          <li><strong>RTCM 1084</strong>: GLONASS MSM4 carrier signals.</li>
          <li><strong>RTCM 1094</strong>: Galileo MSM4 carrier signals.</li>
          <li><strong>RTCM 1114</strong>: QZSS MSM4 carrier signals.</li>
          <li><strong>RTCM 1124</strong>: BeiDou MSM4 carrier signals.</li>
          <li><strong>RTCM 1134</strong>: IRNSS MSM4 carrier signals.</li>
        </ul>
      `
    },
    pod: {
      title: 'GNSS POD: Precise Orbit Determination',
      html: `
        <h3>High-Fidelity Satellite Trajectory Modeling</h3>
        <p>Precise Orbit Determination (POD) is the process of calculating a satellite's state vector (position and velocity) at a given epoch by matching orbital dynamics models with observation data collected from a global network of ground tracking stations.</p>
        <h3>Dynamical Orbit Models</h3>
        <p>POD algorithms solve a system of differential equations based on Newton's laws of motion, incorporating complex forces acting on the satellites:</p>
        <ul>
          <li><strong>Earth's Gravity Field</strong>: Formulated using spherical harmonics (e.g., EGM2008 model) to capture spatial geoid irregularities.</li>
          <li><strong>Third-Body Perturbations</strong>: Gravitational pull from the Sun, Moon, and other planets.</li>
          <li><strong>Solar Radiation Pressure (SRP)</strong>: The non-gravitational force of solar photons hitting the satellite surface, requiring active solar panel orientation modeling.</li>
          <li><strong>Albedo Effects</strong>: Sunlight reflected off the Earth's surface acting on the satellite.</li>
          <li><strong>Relativistic Corrections</strong>: Time-dilation corrections based on General and Special Relativity.</li>
        </ul>
        <p>By collecting continuous GNSS phase observations from globally distributed stations like GEODNET, POD engines calculate precise orbit files (.SP3 format) and precise clock files (.CLK format) with sub-centimeter accuracies, serving as the baseline input for PPP processing.</p>
      `
    },
    iono: {
      title: 'Ionospheric Modeling & Delay Corrections',
      html: `
        <h3>Understanding Upper Atmospheric Delays</h3>
        <p>The ionosphere is the layer of the Earth's atmosphere from about 50 km to 1000 km altitude where solar radiation ionizes gas molecules, creating a plasma of free electrons. This charged medium disperses GNSS radio signals, changing the phase speed and group velocity of the waves. It is the largest variable source of positioning error.</p>
        <h3>Ionospheric Math and Multi-Frequency Cleansing</h3>
        <p>Because the ionosphere is a dispersive medium, the propagation delay is inversely proportional to the square of the signal frequency (f):</p>
        <p style="font-family: var(--font-mono); background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 6px; margin: 1rem 0;">
          I_delay ≈ (40.3 × TEC) / f²
        </p>
        <p>By combining two distinct carrier frequencies (e.g., L1 and L2), receivers form the <strong>Ionosphere-Free (IF) Linear Combination</strong>, which cancels out 99.9% of first-order ionosphere delays:</p>
        <p style="font-family: var(--font-mono); background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 6px; margin: 1rem 0;">
          Φ_IF = (f1² × Φ1 - f2² × Φ2) / (f1² - f2²)
        </p>
        <p>For single-frequency receivers, casters model regional atmospheric delays by mapping Total Electron Content (TEC) grids over geographic networks to inject local corrections via RTCM messages.</p>
      `
    },
    tropo: {
      title: 'Tropospheric Modeling & Mapping Functions',
      html: `
        <h3>Lower Atmospheric Signal Refraction</h3>
        <p>The troposphere is the lowest portion of Earth's atmosphere (up to ~16 km), consisting of dry gases and water vapor. Unlike the ionosphere, the troposphere is a non-dispersive medium for GNSS frequencies, meaning the delay cannot be removed by combining frequencies. The delay is instead separated into two components: Hydrostatic (dry) delay and Wet delay.</p>
        <h3>Dry vs. Wet Delay Models</h3>
        <ul>
          <li><strong>Tropospheric Hydrostatic Delay (ZHD)</strong>: Accountable for 90% of the total delay (~2.3 meters at zenith). It is highly predictable based on surface pressure and temperature, and can be modeled with millimeter-level precision using the Saastamoinen or Hopfield models.</li>
          <li><strong>Tropospheric Wet Delay (ZWD)</strong>: Accountable for 10% of the total delay (~0 to 40 cm). It is caused by highly variable atmospheric water vapor. ZWD is difficult to model and is typically estimated as an unknown parameter in PPP positioning.</li>
        </ul>
        <h3>Mapping Functions</h3>
        <p>To scale zenith path delays to the slant path between the receiver and a low-elevation satellite, algorithms apply mathematical **Mapping Functions** (such as Niell Mapping Function, or Vienna Mapping Functions VMF3) which take satellite elevation angle and atmospheric coordinates as parameters.</p>
      `
    }
  };

  // Search input typing handler
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      
      cards.forEach(card => {
        const title = card.querySelector('.kb-card-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.kb-card-excerpt').textContent.toLowerCase();
        const tag = card.querySelector('.kb-card-tag').textContent.toLowerCase();
        
        if (title.includes(q) || excerpt.includes(q) || tag.includes(q)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Click card to open modal
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const topicKey = card.dataset.topic;
      const detail = kbDetails[topicKey];
      if (detail) {
        modalTitle.textContent = detail.title;
        modalBody.innerHTML = detail.html;
        modal.classList.add('active');
      }
    });
  });

  // Close modal logic
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  // Close modal on clicking backdrop
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
}

// 5. Code copier utility
function initCopyToClipboard() {
  // Set up copy triggers
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const el = document.getElementById(targetId);
      if (!el) return;

      const text = el.textContent || el.innerText;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Code copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  });
}

// 6. Simulated Enterprise Console platform logic
function initEnterpriseConsole() {
  // Mock Data
  let authorizedList = [
    { mountpoint: '08D1F9A197D1', region: 'CHE', lat: 47.3000, lon: 8.8400, time: '2026-07-02 23:46:22' },
    { mountpoint: '08D1F9A5D8D5', region: 'GBR', lat: 51.5600, lon: -0.3400, time: '2026-07-02 23:46:22' },
    { mountpoint: '08D1F96379A9', region: 'USA', lat: 25.6400, lon: -80.3400, time: '2026-07-02 23:46:22' },
    { mountpoint: 'E831CD2ABE51', region: 'NLD', lat: 52.3500, lon: 5.5000, time: '2026-07-02 23:46:22' },
    { mountpoint: '8C4B1477B311', region: 'CAN', lat: 44.3500, lon: -79.0400, time: '2026-07-02 23:46:22' },
    { mountpoint: '08D1F96380C9', region: 'USA', lat: 35.3000, lon: -97.7200, time: '2026-07-02 23:46:22' }
  ];

  let availableList = [
    { mountpoint: 'AC1518EFAFFD', region: 'CAN', lat: 48.48, lon: -123.33 },
    { mountpoint: 'C05D898DC415', region: 'PRT', lat: 41.24, lon: -7.32 },
    { mountpoint: 'C05D898E4DF1', region: 'GRC', lat: 38.34, lon: 26.13 },
    { mountpoint: '8813BF5CEE5D', region: 'IND', lat: 12.97, lon: 77.76 },
    { mountpoint: 'A0B7651E1A5D', region: 'ROU', lat: 46.65, lon: 23.35 },
    { mountpoint: '8813BF5CF759', region: 'IND', lat: 12.97, lon: 77.76 },
    { mountpoint: 'C05D898D74F9', region: 'USA', lat: 34.98, lon: -79.07 },
    { mountpoint: 'C05D898D0E51', region: 'GBR', lat: 52.40, lon: -0.72 },
    { mountpoint: 'C05D898CA72D', region: 'NOR', lat: 63.05, lon: 10.28 },
    { mountpoint: 'A0B7651DB079', region: 'BGR', lat: 43.16, lon: 25.30 }
  ];

  // DOM Elements
  const tabAuth = document.getElementById('btn-tab-auth');
  const tabMounts = document.getElementById('btn-tab-mounts');
  const panelAuth = document.getElementById('panel-auth-list');
  const panelMounts = document.getElementById('panel-mounts-list');
  const authTableBody = document.getElementById('console-auth-table-body');
  const mountsTableBody = document.getElementById('console-mounts-table-body');
  const authSearchInput = document.getElementById('console-auth-search');
  const mountsSearchInput = document.getElementById('console-mounts-search');
  const totalCountBadge = document.getElementById('console-auth-count');
  
  // Console Modal DOM
  const editModal = document.getElementById('console-edit-modal');
  const editOriginalInput = document.getElementById('console-edit-original');
  const editTargetSelect = document.getElementById('console-edit-target');
  const editCancel = document.getElementById('console-edit-cancel');
  const editSubmit = document.getElementById('console-edit-submit');
  const editClose = document.getElementById('console-close-modal');

  const addModal = document.getElementById('console-add-modal');
  const addTargetSelect = document.getElementById('console-add-target');
  const addCancel = document.getElementById('console-add-cancel');
  const addSubmit = document.getElementById('console-add-submit');
  const addClose = document.getElementById('console-add-close-modal');

  // Trigger buttons
  const btnCreate = document.getElementById('console-btn-create');
  const btnDownload = document.getElementById('console-btn-download');
  const btnUpload = document.getElementById('console-btn-upload');
  const btnDownloadMounts = document.getElementById('console-mounts-btn-download');

  if (!tabAuth) return; // Guard clause if console section is missing

  // 1. Tab Switching
  tabAuth.addEventListener('click', () => {
    tabAuth.classList.add('active');
    tabMounts.classList.remove('active');
    panelAuth.classList.add('active');
    panelMounts.classList.remove('active');
  });

  tabMounts.addEventListener('click', () => {
    tabMounts.classList.add('active');
    tabAuth.classList.remove('active');
    panelMounts.classList.add('active');
    panelAuth.classList.remove('active');
  });

  // 2. Render Tables
  function renderTables() {
    renderAuthTable(authSearchInput.value);
    renderMountsTable(mountsSearchInput.value);
    totalCountBadge.textContent = (2217 + authorizedList.length).toString();
  }

  function renderAuthTable(searchQuery = '') {
    authTableBody.innerHTML = '';
    const q = searchQuery.toLowerCase();
    
    const filtered = authorizedList.filter(st => 
      st.mountpoint.toLowerCase().includes(q) || 
      st.region.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      authTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No authorized stations found.</td></tr>`;
      return;
    }

    filtered.forEach(st => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="mount-code">${st.mountpoint}</span></td>
        <td><span class="badge badge-info">${st.region}</span></td>
        <td>${st.lat.toFixed(4)}</td>
        <td>${st.lon.toFixed(4)}</td>
        <td>${st.time}</td>
        <td style="text-align: center;">
          <button class="btn btn-secondary btn-small console-row-edit" data-mount="${st.mountpoint}">
            <i class="fa-solid fa-pen-to-square" style="color: var(--accent-cyan);"></i> Edit
          </button>
        </td>
      `;
      authTableBody.appendChild(tr);
    });

    // Rebind edit triggers
    document.querySelectorAll('.console-row-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const mount = btn.dataset.mount;
        openEditModal(mount);
      });
    });
  }

  function renderMountsTable(searchQuery = '') {
    mountsTableBody.innerHTML = '';
    const q = searchQuery.toLowerCase();
    
    // Filter available mounts to exclude those already authorized
    const authMounts = new Set(authorizedList.map(a => a.mountpoint));
    const unauthAvailable = availableList.filter(av => !authMounts.has(av.mountpoint));

    const filtered = unauthAvailable.filter(st => 
      st.mountpoint.toLowerCase().includes(q) || 
      st.region.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      mountsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No available mountpoints found.</td></tr>`;
      return;
    }

    filtered.forEach(st => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="mount-code">${st.mountpoint}</span></td>
        <td><span class="badge badge-info" style="background: rgba(6, 182, 212, 0.1); color: var(--accent-cyan); border-color: rgba(6, 182, 212, 0.2);">${st.region}</span></td>
        <td>${st.lat.toFixed(4)}</td>
        <td>${st.lon.toFixed(4)}</td>
      `;
      mountsTableBody.appendChild(tr);
    });
  }

  // 3. Search Filters
  authSearchInput.addEventListener('input', () => {
    renderAuthTable(authSearchInput.value);
  });

  mountsSearchInput.addEventListener('input', () => {
    renderMountsTable(mountsSearchInput.value);
  });

  // 4. Modal Operations
  function openEditModal(mount) {
    editOriginalInput.value = mount;
    
    // Load targets selection list (exclude currently authorized)
    const authMounts = new Set(authorizedList.map(a => a.mountpoint));
    editTargetSelect.innerHTML = '';
    
    availableList.forEach(av => {
      if (!authMounts.has(av.mountpoint)) {
        const opt = document.createElement('option');
        opt.value = av.mountpoint;
        opt.textContent = `${av.mountpoint} (${av.region} - Lat: ${av.lat}, Lon: ${av.lon})`;
        editTargetSelect.appendChild(opt);
      }
    });

    if (editTargetSelect.children.length === 0) {
      showToast('Error: No available mountpoints left in the pool!');
      return;
    }

    editModal.classList.add('active');
  }

  function closeEditModal() {
    editModal.classList.remove('active');
  }

  editCancel.addEventListener('click', closeEditModal);
  editClose.addEventListener('click', closeEditModal);

  // Edit Submission (Replace Station)
  editSubmit.addEventListener('click', () => {
    const orig = editOriginalInput.value;
    const target = editTargetSelect.value;
    
    const targetItem = availableList.find(av => av.mountpoint === target);
    if (!targetItem) return;

    // Find original index
    const idx = authorizedList.findIndex(a => a.mountpoint === orig);
    if (idx !== -1) {
      // Perform replacement
      authorizedList[idx] = {
        mountpoint: targetItem.mountpoint,
        region: targetItem.region,
        lat: targetItem.lat,
        lon: targetItem.lon,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      
      renderTables();
      closeEditModal();
      showToast(`Station ${orig} successfully replaced with ${target}!`);
    }
  });

  // Add Station Modal
  function openAddModal() {
    const authMounts = new Set(authorizedList.map(a => a.mountpoint));
    addTargetSelect.innerHTML = '';
    
    availableList.forEach(av => {
      if (!authMounts.has(av.mountpoint)) {
        const opt = document.createElement('option');
        opt.value = av.mountpoint;
        opt.textContent = `${av.mountpoint} (${av.region} - Lat: ${av.lat}, Lon: ${av.lon})`;
        addTargetSelect.appendChild(opt);
      }
    });

    if (addTargetSelect.children.length === 0) {
      showToast('All available stations have already been authorized!');
      return;
    }

    addModal.classList.add('active');
  }

  function closeAddModal() {
    addModal.classList.remove('active');
  }

  addCancel.addEventListener('click', closeAddModal);
  addClose.addEventListener('click', closeAddModal);

  // Add Station Submission
  addSubmit.addEventListener('click', () => {
    const target = addTargetSelect.value;
    const targetItem = availableList.find(av => av.mountpoint === target);
    if (!targetItem) return;

    // Add to authorized list
    authorizedList.push({
      mountpoint: targetItem.mountpoint,
      region: targetItem.region,
      lat: targetItem.lat,
      lon: targetItem.lon,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    renderTables();
    closeAddModal();
    showToast(`New station ${target} authorized successfully!`);
  });

  // 5. Actions triggers
  btnCreate.addEventListener('click', openAddModal);

  btnDownload.addEventListener('click', () => {
    showToast('Generating authorized list CSV... Download started!');
  });

  btnUpload.addEventListener('click', () => {
    // Simulate batch upload
    showToast('Simulating CSV upload... Processing batch list...');
    setTimeout(() => {
      // Add two mock stations
      const mocks = [
        { mountpoint: 'C05D898E4DF1', region: 'GRC', lat: 38.34, lon: 26.13, time: new Date().toISOString().replace('T', ' ').substring(0, 19) },
        { mountpoint: 'A0B7651DB079', region: 'BGR', lat: 43.16, lon: 25.30, time: new Date().toISOString().replace('T', ' ').substring(0, 19) }
      ];

      mocks.forEach(m => {
        if (!authorizedList.find(a => a.mountpoint === m.mountpoint)) {
          authorizedList.push(m);
        }
      });

      renderTables();
      showToast('Batch uploaded 2 new stations successfully!');
    }, 1200);
  });

  btnDownloadMounts.addEventListener('click', () => {
    showToast('Generating available mountpoints list... Download started!');
  });

  // Initial table render
  renderTables();
}

// 7. Onboarding Form Submission handling
function initOnboardingForm() {
  const form = document.getElementById('onboarding-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const company = document.getElementById('contact-company').value;
    const stations = document.getElementById('contact-stations').value;
    const useCase = document.getElementById('contact-usecase').value;

    // Simulate submission progress
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Sending request...</span>`;

    setTimeout(() => {
      // Success confirmation
      showToast(`Inquiry sent! Thank you, ${name}. Our onboarding team will contact you at ${email}.`);
      
      // Reset form
      form.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    }, 1500);
  });
}

// Global Toast Notification helper
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">✓</span> <span class="toast-message">${message}</span>`;
    document.body.appendChild(toast);
  } else {
    toast.querySelector('.toast-message').textContent = message;
  }

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
