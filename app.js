/* ==========================================================================
   STUDENT MARKS PORTAL - APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const container = document.getElementById('marks-slip-container');
    const btnFillMock = document.getElementById('btn-fill-mock');
    const btnClear = document.getElementById('btn-clear');
    const btnPrint = document.getElementById('btn-print');
    const btnUploadCSV = document.getElementById('btn-upload-csv');
    const csvFileInput = document.getElementById('csv-file-input');
    const themeBtn = document.getElementById('theme-btn');
    const toast = document.getElementById('toast');
    const slipTemplate = document.getElementById('slip-template');
    
    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statAvg = document.getElementById('stat-avg');
    const statRange = document.getElementById('stat-range');
    
    // Constants
    const SLIP_ROW_COUNT = 30;
    
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
        sem: "",
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
    themeBtn.addEventListener('click', toggleTheme);
    
    // CSV Upload
    btnUploadCSV.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', uploadCSV);
    
    // Event delegation on the parent container (handles updates & navigation)
    container.addEventListener('input', handleInputs);
    container.addEventListener('change', handleInputs);
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

            // Clone the template from HTML
            const paperSlip = slipTemplate.content.cloneNode(true).firstElementChild;
            paperSlip.setAttribute('data-slip-index', slipIndex);

            // Patch radio button name attributes (must be unique per slip)
            paperSlip.querySelectorAll('.sync-radio').forEach(radio => {
                const group = radio.getAttribute('data-radio-group');
                const camelGroup = group.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                radio.name = `${group}-${slipIndex}`;
                // Restore checked state from metaData
                if (metaData[camelGroup] && radio.value === metaData[camelGroup]) {
                    radio.checked = true;
                    radio.classList.add('checked-active');
                }
            });

            // Dynamically hide course options based on programme
            if (metaData.programme !== "II-MSC CS 'A'") {
                const codeSelect = paperSlip.querySelector('.course-code-dropdown');
                const nameSelect = paperSlip.querySelector('.course-dropdown');
                if (codeSelect) {
                    while (codeSelect.options.length > 1) codeSelect.remove(1);
                }
                if (nameSelect) {
                    while (nameSelect.options.length > 1) nameSelect.remove(1);
                }
            }

            // Restore sync-meta input values from metaData
            paperSlip.querySelectorAll('.sync-meta').forEach(input => {
                const key = input.getAttribute('data-meta-id');
                // Convert kebab-case to camelCase for metaData lookup
                const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                
                if (metaData[camelKey] !== undefined && metaData[camelKey] !== '') {
                    input.value = metaData[camelKey];
                } else if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });

            // Build and inject table rows
            const tbody = paperSlip.querySelector('.slip-tbody');
            for (let r = 0; r < SLIP_ROW_COUNT; r++) {
                const globalIndex = startIndex + r;
                const student = studentData[globalIndex];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="col-sno-cell">
                        <input type="text" class="input-sno" data-global-index="${globalIndex}" value="${student.sno || ''}" maxlength="5">
                    </td>
                    <td class="col-reg-cell">
                        <input type="text" class="input-reg" data-global-index="${globalIndex}" value="${student.reg}" maxlength="15">
                    </td>
                    <td class="col-marks-cell">
                        <input type="text" class="input-mark" data-global-index="${globalIndex}" min="0" max="100" value="${student.mark}">
                    </td>`;
                tbody.appendChild(tr);
            }

            container.appendChild(paperSlip);
        }
        updateStats();
    }


    // Preloaded Database from College_data.csv
    const collegeStudentDatabase = [
        { reg: "P25CS0001", name: "AJAY NANDHAKUMAR S" },
        { reg: "P25CS0002", name: "ANBU R" },
        { reg: "P25CS0003", name: "DEVIESAKKIYA S" },
        { reg: "P25CS0004", name: "ESWAR S" },
        { reg: "P25CS0005", name: "HARINIVETHAN M" },
        { reg: "P25CS0006", name: "HARISH S" },
        { reg: "P25CS0007", name: "HINDUJA T" },
        { reg: "P25CS0008", name: "JAYABHARATHI S" },
        { reg: "P25CS0010", name: "KARTHIKEYAN B" },
        { reg: "P25CS0011", name: "KARTHIKEYAN G" },
        { reg: "P25CS0012", name: "LOGESHWARAN M" },
        { reg: "P25CS0013", name: "LOGESHWARAN D" },
        { reg: "P25CS0014", name: "LOGU S" },
        { reg: "P25CS0015", name: "MAHALAKSHMI V" },
        { reg: "P25CS0017", name: "MOHAN M" },
        { reg: "P25CS0018", name: "NAVEENKUMAR J" },
        { reg: "P25CS0019", name: "PARTHIBAN V" },
        { reg: "P25CS0020", name: "PRASANTH S" },
        { reg: "P25CS0022", name: "SANJAI V" },
        { reg: "P25CS0023", name: "SATHIYASEELAN M" },
        { reg: "P25CS0024", name: "SRI HARI KRISHNAN S" },
        { reg: "P25CS0025", name: "SRIGUGAN E" },
        { reg: "P25CS0027", name: "SURYA M" },
        { reg: "P25CS0028", name: "RAJAMANICKAM S" },
        { reg: "P25CS0029", name: "SANJANA S" },
        { reg: "P25CS0030", name: "ERANIYA KUMAR J" },
        { reg: "P25CS0031", name: "ESWAR C" },
        { reg: "P25CS0032", name: "IMMANUVEL A" },
        { reg: "P25CS0033", name: "DHIYANESHWARAN P" },
        { reg: "P25CS0035", name: "KANETHKAR LOGESH K" },
        { reg: "P25CS0036", name: "KURALARASAN M" },
        { reg: "P25CS0037", name: "DEVARASAN R" }
    ];

    /* ==========================================================================
       INPUT SYNCHRONIZATION AND STATE UPDATES
       ========================================================================== */
    function handleInputs(e) {
        // Handle metadata input synchronization across slips
        if (e.target.classList.contains('sync-meta')) {
            const metaId = e.target.getAttribute('data-meta-id');
            const camelKey = metaId.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            const val = e.target.value;
            metaData[camelKey] = val;

            document.querySelectorAll(`.sync-meta[data-meta-id="${metaId}"]`).forEach(input => {
                if (input !== e.target) {
                    input.value = val;
                }
            });

            if (metaId === 'programme' && val) {
                autoFillClassData(val);
            }

            if (metaId === 'course-name' && val) {
                autoFillCourseCode(val);
            }
            return;
        }

        // Handle S.No entry
        if (e.target.classList.contains('input-sno')) {
            const idx = parseInt(e.target.getAttribute('data-global-index'));
            studentData[idx].sno = e.target.value;
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

            let valStr = e.target.value.trim().toUpperCase();
            let val = parseInt(valStr);
            let isAllowedString = (valStr === 'A' || valStr === 'P');

            if (valStr !== '' && !isAllowedString && (isNaN(val) || val < 0 || val > 100)) {
                e.target.style.border = '2px solid var(--accent-red)';
                showToast("Marks must be between 0 and 100, or 'A' / 'P'", 'error');
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
            const camelGroup = groupName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            const value = radio.value;

            if (radio.classList.contains('checked-active')) {
                // Clicking an already selected option deselects it globally
                metaData[camelGroup] = "";
                document.querySelectorAll(`.sync-radio[data-radio-group="${groupName}"]`).forEach(r => {
                    r.checked = false;
                    r.classList.remove('checked-active');
                });
            } else {
                // Selects option and synchronizes across all slips
                metaData[camelGroup] = value;
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
        let highest = -Infinity;
        let lowest = Infinity;
        
        studentData.forEach((student, idx) => {
            const hasData = student.reg.trim() !== '' || String(student.mark).trim() !== '';

            const markVal = student.mark;
            
            if (markVal !== undefined && markVal !== null && String(markVal).trim() !== '') {
                const mark = parseFloat(markVal);
                if (!isNaN(mark) && mark >= 0 && mark <= 100) {
                    totalEntered++;
                    sum += mark;
                    
                    if (mark > highest) highest = mark;
                    if (mark < lowest) lowest = mark;
                }
            }
        });
        
        const average = totalEntered > 0 ? (sum / totalEntered).toFixed(1) : '0.0';
        const highestVal = highest === -Infinity ? '-' : highest;
        const lowestVal = lowest === Infinity ? '-' : lowest;
        
        statTotal.textContent = totalEntered;
        statAvg.textContent = average;
        statRange.textContent = `${highestVal} / ${lowestVal}`;
    }

    /* ==========================================================================
       AUTO-FILL FROM COLLEGE_DATA.CSV
       ========================================================================== */
    function autoFillClassData(selectedProg) {
        if (!selectedProg) return;

        // Parse Year, Programme, and Section (e.g. "II-MSC CS 'A'" -> Year: II, Prog: MSC CS, Sec: A)
        let semVal = "";
        let secVal = "";
        let progVal = selectedProg;

        const match = selectedProg.match(/^(III|II|I)-([A-Z\s]+)(?:\s*'([A-Z])')?$/i);
        if (match) {
            const yearStr = match[1].toUpperCase();
            progVal = match[2].trim();
            secVal = match[3] ? match[3].toUpperCase() : "A";

            if (yearStr === "I") semVal = "I";
            else if (yearStr === "II") semVal = "III";
            else if (yearStr === "III") semVal = "V";
        }

        if (semVal) {
            metaData.sem = semVal;
            metaData.semester = semVal;
            document.querySelectorAll('.sync-meta[data-meta-id="sem"]').forEach(el => el.value = semVal);
        }
        if (secVal) {
            metaData.section = secVal;
            document.querySelectorAll('.sync-meta[data-meta-id="section"]').forEach(el => el.value = secVal);
        }
        if (selectedProg) {
            metaData.programme = selectedProg;
        }

        if (selectedProg === "II-MSC CS 'A'") {
            // Auto-fill student records from College_data.csv database
            const count = collegeStudentDatabase.length;
            const numSlipsNeeded = Math.max(1, Math.ceil(count / SLIP_ROW_COUNT));
            studentData = Array.from({length: numSlipsNeeded * SLIP_ROW_COUNT}, () => ({reg: '', mark: ''}));

            collegeStudentDatabase.forEach((st, i) => {
                studentData[i] = { sno: String(i + 1), reg: st.reg, mark: '' };
            });
            showToast(`✓ Auto-filled ${count} student records for ${selectedProg} from College_data.csv!`, 'success');
        } else {
            // Clear student data for other selections
            studentData = Array.from({length: SLIP_ROW_COUNT}, () => ({reg: '', mark: ''}));
            metaData.courseName = "";
            metaData.courseCode = "";
        }

        renderSlips(true);
    }

    /* ==========================================================================
       AUTO-FILL COURSE CODE
       ========================================================================== */
    function autoFillCourseCode(courseName) {
        const courseMapping = {
            "AI & ML": "P24MCS311TA",
            "SPM": "P24MCS312TA",
            "CNS": "P24MCS314TA",
            "E-Commerce Technologies": "P24LCS303TA",
            "Softskills for Professional Excellence": "P24VCC301TA"
        };

        const code = courseMapping[courseName];
        if (code) {
            metaData.courseCode = code;
            document.querySelectorAll('.sync-meta[data-meta-id="course-code"]').forEach(el => el.value = code);
        }
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
            studentData[idx].sno = String(idx + 1);
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
        if (confirm('Are you sure you want to clear all data, including marks and header selections?')) {
            studentData = Array.from({length: SLIP_ROW_COUNT}, () => ({reg: '', mark: ''}));
            
            // Clear all evaluation types
            metaData.unitTest = "";
            metaData.assignment = "";
            metaData.seminar = "";
            metaData.presem = "";
            
            // Reset dropdowns and text fields in state
            metaData.programme = "";
            metaData.courseCode = "";
            metaData.courseName = "";
            metaData.semester = "";
            metaData.sem = "";
            metaData.section = "";
            metaData.conductedOn = "";
            metaData.submittedDate = "";

            // Force clear all radio buttons in DOM
            document.querySelectorAll('.sync-radio').forEach(radio => {
                radio.checked = false;
                radio.classList.remove('checked-active');
            });

            // Force reset all dropdowns to default option 0 and text inputs to empty in DOM
            document.querySelectorAll('.sync-meta').forEach(input => {
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
            
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
            studentData[idx] = { sno: String(idx + 1), reg: student.reg, mark: student.mark };
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
