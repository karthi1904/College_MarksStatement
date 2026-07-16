/* ==========================================================================
   STUDENT MARKS PORTAL - APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const container = document.getElementById('marks-slip-container');
    const btnFillMock = document.getElementById('btn-fill-mock');
    const btnClear = document.getElementById('btn-clear');
    const btnPrint = document.getElementById('btn-print');
    const btnExport = document.getElementById('btn-export');
    const btnUploadCSV = document.getElementById('btn-upload-csv');
    const csvFileInput = document.getElementById('csv-file-input');
    const themeBtn = document.getElementById('theme-btn');
    const toast = document.getElementById('toast');
    
    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statAvg = document.getElementById('stat-avg');
    const statPass = document.getElementById('stat-pass');
    const statRange = document.getElementById('stat-range');
    
    // Constants
    const SLIP_ROW_COUNT = 30;
    const PASS_MARK = 40;
    
    // Dates Setup
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Global Application State
    let studentData = Array.from({length: SLIP_ROW_COUNT}, () => ({reg: '', mark: ''}));
    let lastSlipCount = 0;

    const metaData = {
        programme: "",
        courseCode: "",
        courseName: "",
        semester: "",
        section: "",
        conductedOn: "",
        submittedDate: "",
        unitTest: "",
        assignment: "",
        seminar: "",
        presem: ""
    };
    
    // Initialize Theme
    initTheme();
    
    // Initial Render
    renderSlips(true);
    
    // Event Listeners
    btnFillMock.addEventListener('click', fillMockData);
    btnClear.addEventListener('click', clearSheet);
    btnPrint.addEventListener('click', printSlip);
    btnExport.addEventListener('click', exportCSV);
    themeBtn.addEventListener('click', toggleTheme);
    
    // CSV Upload
    btnUploadCSV.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', uploadCSV);
    
    // Event delegation on the parent container (handles updates & navigation)
    container.addEventListener('input', handleInputs);
    container.addEventListener('keydown', handleTableNavigation);
    container.addEventListener('click', handleRadioClicks);

    /* ==========================================================================
       DYNAMIC SLIP RENDERER
       ========================================================================== */
    function renderSlips(force = false) {
        const numSlips = Math.max(1, Math.ceil(studentData.length / SLIP_ROW_COUNT));
        
        // Pad studentData to align with slip boundaries
        while (studentData.length < numSlips * SLIP_ROW_COUNT) {
            studentData.push({reg: '', mark: ''});
        }

        // Only full-render if forced or if the sheet count changed to preserve typing focus
        if (!force && numSlips === lastSlipCount) {
            return;
        }

        lastSlipCount = numSlips;
        container.innerHTML = '';

        for (let s = 0; s < numSlips; s++) {
            const slipIndex = s;
            const startIndex = s * SLIP_ROW_COUNT;
            
            // Build rows HTML
            let rowsHTML = '';
            for (let r = 0; r < SLIP_ROW_COUNT; r++) {
                const globalIndex = startIndex + r;
                const student = studentData[globalIndex];
                const sno = r + 1;
                
                rowsHTML += `
                    <tr>
                        <td class="col-sno">${sno}</td>
                        <td class="col-reg-cell">
                            <input type="text" class="input-reg" data-global-index="${globalIndex}" value="${student.reg}" maxlength="15">
                        </td>
                        <td class="col-marks-cell">
                            <input type="number" class="input-mark" data-global-index="${globalIndex}" min="0" max="100" value="${student.mark}">
                        </td>
                    </tr>
                `;
            }

            // Create Paper Slip Div
            const paperSlip = document.createElement('div');
            paperSlip.className = 'paper-slip';
            paperSlip.setAttribute('data-slip-index', slipIndex);
            
            paperSlip.innerHTML = `
                <!-- Header (replicates paper heading) -->
                <header class="slip-header">
                    <div class="slip-logo-wrapper">
                        <img src="assets/logo.png" alt="College Logo" class="slip-logo">
                    </div>
                    <div class="slip-title-block">
                        <h2 class="college-name">SRIMAD ANDAVAN ARTS & SCIENCE COLLEGE</h2>
                        <span class="autonomous-tag">(Autonomous)</span>
                        <p class="college-location">TIRUCHIRAPPALLI-5</p>
                        <h1 class="document-title">STATEMENT OF MARKS</h1>
                    </div>
                </header>

                <!-- Slip Metadata Inputs -->
                <section class="slip-meta-grid">
                    <div class="meta-field">
                        <label>PROGRAMME :</label>
                        <input type="text" class="slip-input sync-meta" data-meta-id="programme" value="${metaData.programme}">
                    </div>
                    <div class="meta-field">
                        <label>COURSE CODE :</label>
                        <input type="text" class="slip-input sync-meta" data-meta-id="course-code" value="${metaData.courseCode}">
                    </div>
                    <div class="meta-field">
                        <label>COURSE NAME :</label>
                        <input type="text" class="slip-input sync-meta" data-meta-id="course-name" value="${metaData.courseName}">
                    </div>
                    
                    <div class="meta-row-two-col">
                        <div class="meta-field">
                            <label>SEMESTER :</label>
                            <input type="text" class="slip-input short sync-meta" data-meta-id="semester" value="${metaData.semester}">
                        </div>
                        <div class="meta-field">
                            <label>SECTION :</label>
                            <input type="text" class="slip-input short sync-meta" data-meta-id="section" value="${metaData.section}">
                        </div>
                    </div>

                    <div class="meta-field">
                        <label>TEST CONDUCTED ON :</label>
                        <input type="text" class="slip-input-date sync-meta" data-meta-id="conducted-on" value="${metaData.conductedOn}">
                    </div>
                    <div class="meta-field">
                        <label>SUBMITTED DATE :</label>
                        <input type="text" class="slip-input-date sync-meta" data-meta-id="submitted-date" value="${metaData.submittedDate}">
                    </div>

                    <!-- Evaluation Type Labels (no checkbox squares) -->
                    <div class="assessment-categories">
                        <!-- Unit Test -->
                        <div class="assessment-group">
                            <span class="group-label">UNIT TEST:</span>
                            <div class="options-container">
                                <label class="pills-chk">
                                    <input type="radio" name="unit-test-${slipIndex}" value="I" class="sync-radio" data-radio-group="unit-test"
                                </label>
                                <label class="pills-chk">
                                    <input type="radio" name="unit-test-${slipIndex}" value="II" class="sync-radio" data-radio-group="unit-test"
                                </label>
                            </div>
                        </div>

                        <!-- Assignment -->
                        <div class="assessment-group">
                            <span class="group-label">ASSIGNMENT:</span>
                            <div class="options-container">
                                <label class="pills-chk">
                                    <input type="radio" name="assignment-${slipIndex}" value="I" class="sync-radio" data-radio-group="assignment"
                                </label>
                                <label class="pills-chk">
                                    <input type="radio" name="assignment-${slipIndex}" value="II" class="sync-radio" data-radio-group="assignment"                                
                                </label>
                            </div>
                        </div>

                        <!-- Seminar -->
                        <div class="assessment-group">
                            <span class="group-label">SEMINAR:</span>
                            <div class="options-container">
                                <label class="pills-chk">
                                    <input type="radio" name="seminar-${slipIndex}" value="I" class="sync-radio" data-radio-group="seminar"
                                </label>
                                <label class="pills-chk">
                                    <input type="radio" name="seminar-${slipIndex}" value="II" class="sync-radio" data-radio-group="seminar"
                                </label>
                            </div>
                        </div>

                        <!-- Pre-Sem -->
                        <div class="assessment-group">
                            <span class="group-label">PRE SEM:</span>
                            <div class="options-container">
                                <label class="pills-chk">
                                    <input type="radio" name="presem-${slipIndex}" value="I" class="sync-radio" data-radio-group="presem"
                                </label>
                                <label class="pills-chk">
                                    <input type="radio" name="presem-${slipIndex}" value="OTHERS" class="sync-radio" data-radio-group="presem"
                                </label>
                            </div>
                        </div>
                    </div>

                </section>


                <!-- Marks Table Area -->
                <div class="table-outer-wrapper">
                    <table class="marks-table">
                        <thead>
                            <tr>
                                <th class="col-sno">S.No</th>
                                <th class="col-reg">REGISTER NO.</th>
                                <th class="col-marks">MARKS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>
                </div>

                <!-- Footer Signatures -->
                <footer class="slip-footer">
                    <div class="signature-line">
                        <span class="sig-label">COURSE INCHARGE</span>
                    </div>
                    <div class="signature-line">
                        <span class="sig-label">HOD</span>
                    </div>
                    <div class="signature-line">
                        <span class="sig-label">ENTERED BY</span>
                    </div>
                </footer>
            `;
            container.appendChild(paperSlip);
        }
        updateStats();
    }

    /* ==========================================================================
       INPUT SYNCHRONIZATION AND STATE UPDATES
       ========================================================================== */
    function handleInputs(e) {
        // Handle metadata input synchronization across slips
        if (e.target.classList.contains('sync-meta')) {
            const metaId = e.target.getAttribute('data-meta-id');
            const val = e.target.value;
            metaData[metaId] = val;

            document.querySelectorAll(`.sync-meta[data-meta-id="${metaId}"]`).forEach(input => {
                if (input !== e.target) {
                    input.value = val;
                }
            });
            return;
        }

        // Handle Register Number entry
        if (e.target.classList.contains('input-reg')) {
            const idx = parseInt(e.target.getAttribute('data-global-index'));
            studentData[idx].reg = e.target.value;
            updateStats();
            return;
        }

        // Handle Marks entry
        if (e.target.classList.contains('input-mark')) {
            const idx = parseInt(e.target.getAttribute('data-global-index'));
            studentData[idx].mark = e.target.value;

            let val = parseInt(e.target.value);
            if (e.target.value !== '' && (isNaN(val) || val < 0 || val > 100)) {
                e.target.style.border = '2px solid var(--accent-red)';
                showToast('Marks must be between 0 and 100', 'error');
            } else {
                e.target.style.border = '';
            }
            updateStats();
            return;
        }
    }

    /* ==========================================================================
       RADIO BUTTON CLICKS & SYNCHRONIZATION
       ========================================================================== */
    function handleRadioClicks(e) {
        if (e.target.type === 'radio' && e.target.classList.contains('sync-radio')) {
            const radio = e.target;
            const groupName = radio.getAttribute('data-radio-group');
            const value = radio.value;

            if (radio.classList.contains('checked-active')) {
                // Clicking an already selected option deselects it globally
                metaData[groupName] = "";
                document.querySelectorAll(`.sync-radio[data-radio-group="${groupName}"]`).forEach(r => {
                    r.checked = false;
                    r.classList.remove('checked-active');
                });
            } else {
                // Selects option and synchronizes across all slips
                metaData[groupName] = value;
                document.querySelectorAll(`.sync-radio[data-radio-group="${groupName}"]`).forEach(r => {
                    if (r.value === value) {
                        r.checked = true;
                        r.classList.add('checked-active');
                    } else {
                        r.checked = false;
                        r.classList.remove('checked-active');
                    }
                });
            }
        }
    }

    /* ==========================================================================
       KEYBOARD EXCEL-LIKE NAVIGATION
       ========================================================================== */
    function handleTableNavigation(e) {
        const input = e.target;
        if (!input.classList.contains('input-reg') && !input.classList.contains('input-mark')) return;
        
        const globalIdx = parseInt(input.getAttribute('data-global-index'));
        const isReg = input.classList.contains('input-reg');
        
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isReg) {
                const markInput = document.querySelector(`.input-mark[data-global-index="${globalIdx}"]`);
                if (markInput) markInput.focus();
            } else {
                const nextRegInput = document.querySelector(`.input-reg[data-global-index="${globalIdx + 1}"]`);
                if (nextRegInput) {
                    nextRegInput.focus();
                } else {
                    // Reached the end of the last table. Append a new slip dynamically!
                    appendNewSlip();
                    setTimeout(() => {
                        const newRegInput = document.querySelector(`.input-reg[data-global-index="${globalIdx + 1}"]`);
                        if (newRegInput) newRegInput.focus();
                    }, 50);
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const targetClass = isReg ? '.input-reg' : '.input-mark';
            const nextInput = document.querySelector(`${targetClass}[data-global-index="${globalIdx + 1}"]`);
            if (nextInput) nextInput.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const targetClass = isReg ? '.input-reg' : '.input-mark';
            const prevInput = document.querySelector(`${targetClass}[data-global-index="${globalIdx - 1}"]`);
            if (prevInput) prevInput.focus();
        } else if (e.key === 'ArrowRight' && isReg && input.selectionEnd === input.value.length) {
            const markInput = document.querySelector(`.input-mark[data-global-index="${globalIdx}"]`);
            if (markInput) markInput.focus();
        } else if (e.key === 'ArrowLeft' && !isReg && input.selectionStart === 0) {
            const regInput = document.querySelector(`.input-reg[data-global-index="${globalIdx}"]`);
            if (regInput) regInput.focus();
        }
    }

    function appendNewSlip() {
        for (let i = 0; i < SLIP_ROW_COUNT; i++) {
            studentData.push({reg: '', mark: ''});
        }
        renderSlips(true);
    }

    /* ==========================================================================
       LIVE STATS CALCULATION
       ========================================================================== */
    function updateStats() {
        let totalEntered = 0;
        let sum = 0;
        let passCount = 0;
        let highest = -Infinity;
        let lowest = Infinity;
        
        studentData.forEach(student => {
            const markVal = student.mark;
            
            if (markVal !== undefined && markVal !== null && String(markVal).trim() !== '') {
                const mark = parseFloat(markVal);
                if (!isNaN(mark) && mark >= 0 && mark <= 100) {
                    totalEntered++;
                    sum += mark;
                    
                    if (mark >= PASS_MARK) {
                        passCount++;
                    }
                    
                    if (mark > highest) highest = mark;
                    if (mark < lowest) lowest = mark;
                }
            }
        });
        
        const average = totalEntered > 0 ? (sum / totalEntered).toFixed(1) : '0.0';
        const passPercent = totalEntered > 0 ? Math.round((passCount / totalEntered) * 100) : 0;
        const highestVal = highest === -Infinity ? '-' : highest;
        const lowestVal = lowest === Infinity ? '-' : lowest;
        
        statTotal.textContent = totalEntered;
        statAvg.textContent = average;
        statPass.textContent = `${passPercent}%`;
        statRange.textContent = `${highestVal} / ${lowestVal}`;
    }

    /* ==========================================================================
       MOCK DEMO DATA GENERATOR
       ========================================================================== */
    function fillMockData() {
        const course = metaData.courseCode || '21UCS305';
        const prefix = course.replace(/[^a-zA-Z]/g, '') || 'UCS';
        const year = course.replace(/[^0-9]/g, '').substring(0, 2) || '21';
        const mockRegPrefix = `${year}${prefix}`;
        
        // Reset state to exactly 2 pages (60 rows) to show slip division
        studentData = Array.from({length: 60}, () => ({reg: '', mark: ''}));
        
        const markGenerator = () => {
            const roll = Math.random();
            if (roll > 0.85) return Math.floor(Math.random() * 11) + 30; // 15% fail (30-40)
            if (roll > 0.4) return Math.floor(Math.random() * 26) + 60;   // 45% B/A grades (60-85)
            return Math.floor(Math.random() * 16) + 85;                  // 40% high achievers (85-100)
        };

        // Fill 32 student records
        for (let idx = 0; idx < 32; idx++) {
            const rollNumber = String(101 + idx);
            studentData[idx].reg = `${mockRegPrefix}${rollNumber}`;
            studentData[idx].mark = markGenerator();
        }

        // Set Unit Test I Checked as default
        metaData.unitTest = "I";

        renderSlips(true);
        showToast('Loaded 32 mock records across 2 slips!', 'success');
    }

    /* ==========================================================================
       CLEAR SHEET DATA
       ========================================================================== */
    function clearSheet() {
        if (confirm('Are you sure you want to clear all register numbers and marks?')) {
            studentData = Array.from({length: SLIP_ROW_COUNT}, () => ({reg: '', mark: ''}));
            metaData.unitTest = "";
            metaData.assignment = "";
            metaData.seminar = "";
            metaData.presem = "";
            renderSlips(true);
            showToast('Sheet cleared successfully', 'success');
        }
    }

    /* ==========================================================================
       PRINT OPERATION
       ========================================================================== */
    function printSlip() {
        const activeRowsCount = parseInt(statTotal.textContent);
        if (activeRowsCount === 0) {
            showToast('Please enter marks before printing.', 'error');
            return;
        }

        showToast('Preparing Print Statement...', 'success');
        setTimeout(() => {
            window.print();
        }, 300);
    }

    /* ==========================================================================
       CSV EXPORTER
       ========================================================================== */
    function exportCSV() {
        const programme = metaData.programme || 'N-A';
        const courseCode = metaData.courseCode || 'N-A';
        const courseName = metaData.courseName || 'N-A';
        const semester = metaData.semester || 'N-A';
        const section = metaData.section || 'N-A';
        
        let examType = 'Other';
        if (metaData.unitTest) examType = `Unit Test ${metaData.unitTest}`;
        else if (metaData.assignment) examType = `Assignment ${metaData.assignment}`;
        else if (metaData.seminar) examType = `Seminar ${metaData.seminar}`;
        else if (metaData.presem) examType = `Pre Sem ${metaData.presem}`;

        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Metadata headers
        csvContent += `"SRIMAD ANDAVAN ARTS & SCIENCE COLLEGE (Autonomous)"\n`;
        csvContent += `"STATEMENT OF MARKS"\n\n`;
        csvContent += `"Programme:","${programme}","Course Code:","${courseCode}"\n`;
        csvContent += `"Course Name:","${courseName}","Semester:","${semester}","Section:","${section}"\n`;
        csvContent += `"Test Type:","${examType}"\n\n`;
        
        // Columns
        csvContent += `"S.No","Register Number","Marks"\n`;
        
        let validRows = 0;
        studentData.forEach((student, idx) => {
            const regNum = student.reg.trim();
            const mark = String(student.mark).trim();
            
            if (regNum !== '' || mark !== '') {
                csvContent += `"${idx+1}","${regNum}","${mark}"\n`;
                validRows++;
            }
        });
        
        if (validRows === 0) {
            showToast('No student records found to export', 'error');
            return;
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Statement_of_Marks_${courseCode.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Downloaded CSV Successfully!', 'success');
    }

    /* ==========================================================================
       CSV UPLOADER
       ========================================================================== */
    function uploadCSV(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            showToast('Please select a valid .csv file', 'error');
            csvFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
            const text = evt.target.result;
            parseAndLoadCSV(text, file.name);
            csvFileInput.value = '';
        };
        reader.onerror = function() {
            showToast('Error reading the CSV file', 'error');
        };
        reader.readAsText(file);
    }

    function parseAndLoadCSV(csvText, fileName) {
        const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const nonEmpty = lines.filter(l => l.trim() !== '');

        if (nonEmpty.length < 2) {
            showToast('CSV file is empty or has no data rows', 'error');
            return;
        }

        let dataStartIndex = 0;
        const firstLineLower = nonEmpty[0].toLowerCase();
        if (firstLineLower.includes('register') || firstLineLower.includes('s.no') || firstLineLower.includes('sno')) {
            dataStartIndex = 1;
        }

        const dataRows = nonEmpty.slice(dataStartIndex);

        if (dataRows.length === 0) {
            showToast('No student data rows found in CSV', 'error');
            return;
        }

        const parsed = [];
        dataRows.forEach(line => {
            const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length >= 2) {
                let regNum, mark;
                if (cols.length >= 3) {
                    regNum = cols[1];
                    mark = cols[2];
                } else {
                    regNum = cols[0];
                    mark = cols[1];
                }

                const parsedMark = parseFloat(mark);
                if (!isNaN(parsedMark) && parsedMark >= 0 && parsedMark <= 100 && regNum !== '') {
                    parsed.push({ reg: regNum.toUpperCase(), mark: parsedMark });
                } else if (regNum !== '' && mark === '') {
                    parsed.push({ reg: regNum.toUpperCase(), mark: '' });
                }
            }
        });

        if (parsed.length === 0) {
            showToast('Could not parse any valid student records from this CSV', 'error');
            return;
        }

        const numSlipsNeeded = Math.max(1, Math.ceil(parsed.length / SLIP_ROW_COUNT));
        studentData = Array.from({length: numSlipsNeeded * SLIP_ROW_COUNT}, () => ({reg: '', mark: ''}));

        parsed.forEach((student, idx) => {
            studentData[idx] = { reg: student.reg, mark: student.mark };
        });

        renderSlips(true);
        showToast(`✓ Loaded ${parsed.length} students from "${fileName}" across ${numSlipsNeeded} sheets`, 'success');
    }

    /* ==========================================================================
       THEME MANAGEMENT
       ========================================================================== */
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }

    function toggleTheme() {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            showToast('Light Theme Enabled');
        } else {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            showToast('Dark Mode Enabled');
        }
    }

    /* ==========================================================================
       TOAST UTILITY
       ========================================================================== */
    function showToast(message, type = 'success') {
        toast.className = `toast-notification ${type} show`;
        
        let icon = '<i class="fa-solid fa-circle-check"></i>';
        if (type === 'error') {
            icon = '<i class="fa-solid fa-circle-exclamation"></i>';
        }
        
        toast.innerHTML = `${icon} <span>${message}</span>`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
