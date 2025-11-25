/**
 * CAP CITY PERCUSSION SCHEDULING SYSTEM
 * =====================================
 * This script manages scheduling for CCW and CC2 ensembles across multiple time blocks.
 *
 * HOW TO USE:
 * 1. Edit the CONFIG object below to set up your schedules
 * 2. Run 'initializeSchedule()' to create all sheets
 * 3. The script will automatically validate as you edit
 */

// ============================================================================
// CONFIGURATION - Edit this section to customize your schedule
// ============================================================================

const CONFIG = {
  // Define your time blocks (as many as needed)
  timeBlocks: [
    'Friday Night',
    'Saturday Morning',
    'Saturday Afternoon',
    'Saturday Evening',
    'Sunday Morning',
    'Sunday Afternoon'
  ],

  // Define ensembles and their sections
  ensembles: {
    'CCW': {
      sections: ['FE', 'BAT', 'VE'],
      fullName: 'Cap City Winds'
    },
    'CC2': {
      sections: ['FE', 'BAT', 'VE'],
      fullName: 'Cap City 2'
    }
  },

  // Staff members organized by specialization
  staff: {
    'Battery': [
      'John Smith',
      'Sarah Johnson',
      'Mike Davis'
    ],
    'Front Ensemble': [
      'Emily Chen',
      'David Martinez',
      'Lisa Anderson'
    ],
    'Visual Ensemble': [
      'Chris Taylor',
      'Amanda White',
      'Kevin Brown'
    ],
    'Visual': [
      'Jessica Lee',
      'Ryan Garcia',
      'Nicole Wilson'
    ]
  },

  // Available spaces
  spaces: [
    'Calumet Gym',      // Can hold entire ensemble
    'Exhibit Hall',     // Can hold entire ensemble
    'Outside',          // Can hold multiple sections
    'Hallway',          // Special rules for FE
    'Room 101',
    'Room 102',
    'Room 103',
    'Room 104',
    'Auxiliary Gym',
    'Practice Field'
  ],

  // Special spaces that can hold multiple sections
  largeSpaces: ['Calumet Gym', 'Exhibit Hall', 'Outside'],

  // Space where FE sections can combine
  feComboSpaces: ['Hallway', 'Outside'],

  // Sheet layout configuration
  layout: {
    startRow: 4,        // First row for schedule data
    timeBlockColumn: 1, // Column A = Time Block
    sectionColumn: 2,   // Column B = Section (CCW FE, CCW BAT, etc.)
    spaceColumn: 3,     // Column C = Space
    staffStartColumn: 4, // Column D onwards = Staff assignments
    rowsBetweenBlocks: 2 // Empty rows between time blocks
  },

  colors: {
    duplicate: '#ff0000',        // Red
    warning: '#ffff00',          // Yellow
    header: '#4a86e8',           // Blue
    sectionLabel: '#d9d9d9',     // Light gray
    timeBlockLabel: '#a4c2f4',   // Light blue
    validSelection: '#b6d7a8'    // Light green
  }
};

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Main initialization function - Run this first!
 * Creates all necessary sheets and sets up the structure
 */
function initializeSchedule() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create or update sheets
  createConfigSheet();
  createScheduleSheet();

  SpreadsheetApp.getUi().alert(
    'Schedule Initialized!',
    `Created schedule with ${CONFIG.timeBlocks.length} time blocks.\n\n` +
    'You can now start filling in your schedule.\n\n' +
    'The script will automatically validate your entries.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Creates a configuration documentation sheet
 */
function createConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Configuration Guide');

  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('Configuration Guide');
  }

  const instructions = [
    ['CAP CITY PERCUSSION SCHEDULING SYSTEM', '', ''],
    ['', '', ''],
    ['CONFIGURATION INSTRUCTIONS', '', ''],
    ['To modify the schedule setup, edit the Apps Script code:', '', ''],
    ['1. Go to Extensions > Apps Script', '', ''],
    ['2. Find the CONFIG object at the top of the code', '', ''],
    ['3. Edit the values as needed', '', ''],
    ['4. Save and run initializeSchedule() again', '', ''],
    ['', '', ''],
    ['CURRENT CONFIGURATION', '', ''],
    ['', '', ''],
    ['Time Blocks:', CONFIG.timeBlocks.length, CONFIG.timeBlocks.join(', ')],
    ['Ensembles:', Object.keys(CONFIG.ensembles).join(', '), ''],
    ['Total Sections:', Object.keys(CONFIG.ensembles).length * 3, ''],
    ['Total Staff:', Object.values(CONFIG.staff).flat().length, ''],
    ['Total Spaces:', CONFIG.spaces.length, ''],
    ['', '', ''],
    ['VALIDATION RULES', '', ''],
    ['', '', ''],
    ['Staff Assignment Rules:', '', ''],
    ['• Battery staff → Battery sections only', '', ''],
    ['• Front Ensemble staff → Front Ensemble sections only', '', ''],
    ['• Visual Ensemble staff → Visual Ensemble + Battery sections', '', ''],
    ['• Visual staff → Battery + Visual Ensemble sections', '', ''],
    ['', '', ''],
    ['Space Assignment Rules:', '', ''],
    ['• Most spaces: One section at a time', '', ''],
    ['• Calumet Gym, Exhibit Hall, Outside: Multiple sections allowed', '', ''],
    ['• Hallway or Outside: FE sections can combine', '', ''],
    ['• VE sections can combine anywhere', '', ''],
    ['', '', ''],
    ['SCHEDULE LAYOUT', '', ''],
    ['', '', ''],
    ['All time blocks are on a single sheet called "Schedule"', '', ''],
    ['Each time block section is separated by blank rows', '', ''],
    ['Validation occurs within each time block independently', '', ''],
    ['', '', ''],
    ['DUPLICATE DETECTION', '', ''],
    ['', '', ''],
    ['The system will highlight in RED when:', '', ''],
    ['• Same staff member assigned to multiple sections (within same time block)', '', ''],
    ['• Same space assigned to multiple sections (with exceptions above)', '', ''],
    ['', '', ''],
    ['The system will highlight in YELLOW when:', '', ''],
    ['• A staff member is assigned to a section they cannot work with', '', '']
  ];

  sheet.getRange(1, 1, instructions.length, 3).setValues(instructions);
  sheet.getRange('A1:C1').merge().setFontSize(16).setFontWeight('bold').setBackground(CONFIG.colors.header);
  sheet.getRange('A3').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A10').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A18').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A31').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A34').setFontWeight('bold').setFontSize(12);
  sheet.getRange('A40').setFontWeight('bold').setFontSize(12);

  sheet.autoResizeColumns(1, 3);
}

/**
 * Creates the main schedule sheet with all time blocks
 */
function createScheduleSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Schedule');

  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet('Schedule');
  }

  // Set up header
  sheet.getRange('A1').setValue('CAP CITY PERCUSSION SCHEDULE').setFontSize(16).setFontWeight('bold');
  sheet.getRange('A2').setValue('Last Updated: ' + new Date().toLocaleString());

  // Set up column headers
  const headerRow = CONFIG.layout.startRow - 1;
  sheet.getRange(headerRow, CONFIG.layout.timeBlockColumn).setValue('Time Block').setFontWeight('bold').setBackground(CONFIG.colors.header);
  sheet.getRange(headerRow, CONFIG.layout.sectionColumn).setValue('Section').setFontWeight('bold').setBackground(CONFIG.colors.header);
  sheet.getRange(headerRow, CONFIG.layout.spaceColumn).setValue('Space').setFontWeight('bold').setBackground(CONFIG.colors.header);

  // Add staff column headers (we'll support up to 10 staff per section)
  const numStaffColumns = 10;
  for (let i = 0; i < numStaffColumns; i++) {
    sheet.getRange(headerRow, CONFIG.layout.staffStartColumn + i)
      .setValue(`Staff ${i + 1}`)
      .setFontWeight('bold')
      .setBackground(CONFIG.colors.header);
  }

  let currentRow = CONFIG.layout.startRow;
  const numSectionsPerBlock = Object.keys(CONFIG.ensembles).length * 3; // 2 ensembles * 3 sections each

  // Create rows for each time block
  CONFIG.timeBlocks.forEach((timeBlock, blockIndex) => {
    // Add rows for each section within this time block
    Object.keys(CONFIG.ensembles).forEach(ensemble => {
      CONFIG.ensembles[ensemble].sections.forEach((section, sectionIndex) => {
        const sectionLabel = `${ensemble} ${section}`;
        const isFirstRowOfBlock = sectionIndex === 0 && ensemble === Object.keys(CONFIG.ensembles)[0];

        // Time block label - only on first row of the block, merged vertically
        if (isFirstRowOfBlock) {
          sheet.getRange(currentRow, CONFIG.layout.timeBlockColumn, numSectionsPerBlock, 1)
            .merge()
            .setValue(timeBlock)
            .setBackground(CONFIG.colors.timeBlockLabel)
            .setFontWeight('bold')
            .setVerticalAlignment('middle')
            .setHorizontalAlignment('center');
        }

        // Section label
        sheet.getRange(currentRow, CONFIG.layout.sectionColumn)
          .setValue(sectionLabel)
          .setBackground(CONFIG.colors.sectionLabel)
          .setFontWeight('bold');

        // Add data validation for space
        const spaceValidation = SpreadsheetApp.newDataValidation()
          .requireValueInList(CONFIG.spaces, true)
          .setAllowInvalid(false)
          .build();
        sheet.getRange(currentRow, CONFIG.layout.spaceColumn).setDataValidation(spaceValidation);

        // Add data validation for staff columns
        const allStaff = Object.values(CONFIG.staff).flat();
        const staffValidation = SpreadsheetApp.newDataValidation()
          .requireValueInList(allStaff, true)
          .setAllowInvalid(false)
          .build();

        for (let i = 0; i < numStaffColumns; i++) {
          sheet.getRange(currentRow, CONFIG.layout.staffStartColumn + i).setDataValidation(staffValidation);
        }

        currentRow++;
      });
    });

    // Add spacing between time blocks (except after last block)
    if (blockIndex < CONFIG.timeBlocks.length - 1) {
      currentRow += CONFIG.layout.rowsBetweenBlocks;
    }
  });

  // Freeze header rows and time block column
  sheet.setFrozenRows(headerRow);
  sheet.setFrozenColumns(CONFIG.layout.timeBlockColumn);

  // Auto-resize columns
  sheet.autoResizeColumns(1, CONFIG.layout.staffStartColumn + numStaffColumns - 1);

  // Add note at bottom
  sheet.getRange(currentRow + 2, CONFIG.layout.timeBlockColumn)
    .setValue('Note: The script will automatically validate staff assignments and space conflicts within each time block.')
    .setFontStyle('italic')
    .setWrap(true);
}

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

/**
 * Returns which sections a staff member can work with based on their category
 */
function getStaffEligibleSections(staffMember) {
  let category = null;

  // Find which category this staff member belongs to
  for (const [cat, members] of Object.entries(CONFIG.staff)) {
    if (members.includes(staffMember)) {
      category = cat;
      break;
    }
  }

  if (!category) return [];

  const allSections = [];
  Object.keys(CONFIG.ensembles).forEach(ensemble => {
    CONFIG.ensembles[ensemble].sections.forEach(section => {
      allSections.push(`${ensemble} ${section}`);
    });
  });

  // Apply rules based on category
  switch (category) {
    case 'Battery':
      return allSections.filter(s => s.includes('BAT'));

    case 'Front Ensemble':
      return allSections.filter(s => s.includes('FE'));

    case 'Visual Ensemble':
      // Can work with VE and BAT sections
      return allSections.filter(s => s.includes('VE') || s.includes('BAT'));

    case 'Visual':
      // Can work with BAT and VE sections
      return allSections.filter(s => s.includes('BAT') || s.includes('VE'));

    default:
      return [];
  }
}

/**
 * Checks if two sections can share a space
 */
function canShareSpace(section1, section2, space) {
  // Same section can't be listed twice
  if (section1 === section2) return false;

  // Large spaces can hold anything
  if (CONFIG.largeSpaces.includes(space)) return true;

  // Extract ensemble and section type
  const [ens1, sec1] = section1.split(' ');
  const [ens2, sec2] = section2.split(' ');

  // VE sections can combine anywhere
  if (sec1 === 'VE' && sec2 === 'VE') return true;

  // FE sections can combine in specific spaces
  if (sec1 === 'FE' && sec2 === 'FE' && CONFIG.feComboSpaces.includes(space)) {
    return true;
  }

  // Otherwise, can't share
  return false;
}

/**
 * Gets the time block for a given row
 */
function getTimeBlockForRow(sheet, row) {
  // Look backwards from the current row to find the merged time block cell
  for (let r = row; r >= CONFIG.layout.startRow; r--) {
    const cell = sheet.getRange(r, CONFIG.layout.timeBlockColumn);
    const value = cell.getValue();
    if (value && CONFIG.timeBlocks.includes(value)) {
      return value;
    }
  }
  return null;
}

/**
 * Gets all row ranges for each time block
 */
function getTimeBlockRanges(sheet) {
  const ranges = {};
  let currentRow = CONFIG.layout.startRow;
  const numSectionsPerBlock = Object.keys(CONFIG.ensembles).length * 3;

  CONFIG.timeBlocks.forEach((timeBlock, blockIndex) => {
    ranges[timeBlock] = {
      startRow: currentRow,
      endRow: currentRow + numSectionsPerBlock - 1
    };

    currentRow += numSectionsPerBlock;

    // Account for spacing between blocks
    if (blockIndex < CONFIG.timeBlocks.length - 1) {
      currentRow += CONFIG.layout.rowsBetweenBlocks;
    }
  });

  return ranges;
}

/**
 * Main validation function - runs on every edit
 */
function validateSchedule(sheet) {
  if (!sheet) return;

  const sheetName = sheet.getName();

  // Only validate the Schedule sheet
  if (sheetName !== 'Schedule') return;

  const timeBlockRanges = getTimeBlockRanges(sheet);

  // Validate each time block separately
  CONFIG.timeBlocks.forEach(timeBlock => {
    const range = timeBlockRanges[timeBlock];
    const numRows = range.endRow - range.startRow + 1;
    const lastCol = CONFIG.layout.staffStartColumn + 9; // 10 staff columns

    // Get all data for this time block
    const dataRange = sheet.getRange(
      range.startRow,
      CONFIG.layout.timeBlockColumn,
      numRows,
      lastCol - CONFIG.layout.timeBlockColumn + 1
    );

    const values = dataRange.getValues();
    const backgrounds = dataRange.getBackgrounds();

    // Reset backgrounds (except time block and section columns)
    for (let r = 0; r < backgrounds.length; r++) {
      for (let c = 2; c < backgrounds[r].length; c++) { // Start at 2 to skip time block and section columns
        backgrounds[r][c] = '#ffffff';
      }
    }

    // Validate each row within this time block
    for (let r = 0; r < values.length; r++) {
      const timeBlockValue = values[r][0]; // Time block (might be empty due to merge)
      const section = values[r][1];        // Section name
      const space = values[r][2];          // Space assignment
      const staff = values[r].slice(3);    // Staff assignments

      // Skip empty rows
      if (!section) continue;

      // Validate space conflicts (only within this time block)
      if (space) {
        for (let r2 = 0; r2 < values.length; r2++) {
          if (r === r2) continue;

          const otherSection = values[r2][1];
          const otherSpace = values[r2][2];

          if (!otherSection) continue; // Skip empty rows

          if (space === otherSpace && !canShareSpace(section, otherSection, space)) {
            backgrounds[r][2] = CONFIG.colors.duplicate; // Highlight space column
          }
        }
      }

      // Validate staff assignments (only within this time block)
      staff.forEach((staffMember, staffIdx) => {
        if (!staffMember) return;

        const staffColIdx = 3 + staffIdx; // Offset for time block, section, and space columns

        // Check if staff member is eligible for this section
        const eligibleSections = getStaffEligibleSections(staffMember);
        if (!eligibleSections.includes(section)) {
          backgrounds[r][staffColIdx] = CONFIG.colors.warning;
        }

        // Check for duplicate staff assignments in this time block
        for (let r2 = 0; r2 < values.length; r2++) {
          if (r === r2) continue;

          const otherStaff = values[r2].slice(3);
          if (otherStaff.includes(staffMember)) {
            backgrounds[r][staffColIdx] = CONFIG.colors.duplicate;
          }
        }
      });
    }

    // Apply background colors
    dataRange.setBackgrounds(backgrounds);
  });

  // Update timestamp
  sheet.getRange('A2').setValue('Last Updated: ' + new Date().toLocaleString());
}

// ============================================================================
// TRIGGER FUNCTIONS
// ============================================================================

/**
 * Automatically runs when any cell is edited
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  validateSchedule(sheet);
}

/**
 * Manually run validation on current sheet
 */
function runValidation() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  validateSchedule(sheet);
  SpreadsheetApp.getUi().alert('Validation complete!');
}

// ============================================================================
// UTILITY FUNCTIONS FOR ADVANCED USERS
// ============================================================================

/**
 * Creates a custom menu in the spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Schedule Manager')
    .addItem('Initialize/Rebuild Schedule', 'initializeSchedule')
    .addSeparator()
    .addItem('Run Validation', 'runValidation')
    .addItem('Show Configuration', 'showConfig')
    .addToUi();
}

/**
 * Shows current configuration in a dialog
 */
function showConfig() {
  const ui = SpreadsheetApp.getUi();

  const configText = `
CURRENT CONFIGURATION
=====================

Time Blocks: ${CONFIG.timeBlocks.length}
${CONFIG.timeBlocks.map((tb, i) => `  ${i + 1}. ${tb}`).join('\n')}

Ensembles: ${Object.keys(CONFIG.ensembles).join(', ')}

Staff Categories:
${Object.entries(CONFIG.staff).map(([cat, members]) => `  ${cat}: ${members.length} members`).join('\n')}

Total Spaces: ${CONFIG.spaces.length}

To modify configuration:
1. Extensions > Apps Script
2. Edit the CONFIG object
3. Save and run Initialize/Rebuild Schedule
  `;

  ui.alert('Current Configuration', configText, ui.ButtonSet.OK);
}
