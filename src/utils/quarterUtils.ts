export function getQuarter(date: string | null | undefined): { quarter: number; year: number } | null {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const month = d.getMonth(); // 0-11
  const year = d.getFullYear();
  
  // Q1 = Jan-Mar (0-2), Q2 = Apr-Jun (3-5), Q3 = Jul-Sep (6-8), Q4 = Oct-Dec (9-11)
  const quarter = Math.floor(month / 3) + 1;
  
  return { quarter, year };
}

export function formatQuarterBadge(startDate: string | null | undefined, dueDate: string | null | undefined): string | null {
  const start = getQuarter(startDate);
  const end = getQuarter(dueDate);
  
  // If no dates, return null
  if (!start && !end) return null;
  
  // If only one date exists, use that
  if (!start && end) return `Q${end.quarter} ${end.year}`;
  if (start && !end) return `Q${start.quarter} ${start.year}`;
  
  // Both dates exist
  if (start && end) {
    // Same quarter and year
    if (start.quarter === end.quarter && start.year === end.year) {
      return `Q${start.quarter} ${start.year}`;
    }
    
    // Same year, different quarters
    if (start.year === end.year) {
      return `Q${start.quarter}-Q${end.quarter} ${start.year}`;
    }
    
    // Different years
    return `Q${start.quarter} ${start.year} - Q${end.quarter} ${end.year}`;
  }
  
  return null;
}

/**
 * Get quarter pattern without year (e.g., "Q1", "Q1-Q3")
 * Used for filtering dropdown
 */
export function getQuarterPattern(startDate: string | null | undefined, dueDate: string | null | undefined, filterYear?: number): string | null {
  const start = getQuarter(startDate);
  const end = getQuarter(dueDate);
  
  // If no dates, return null
  if (!start && !end) return null;
  
  // If filterYear is provided, check if project touches that year
  if (filterYear !== undefined) {
    const touchesYear = (start && start.year === filterYear) || (end && end.year === filterYear) ||
                        (start && end && start.year <= filterYear && end.year >= filterYear);
    if (!touchesYear) return null;
  }
  
  // If only one date exists
  if (!start && end) {
    if (filterYear !== undefined && end.year !== filterYear) return null;
    return `Q${end.quarter}`;
  }
  if (start && !end) {
    if (filterYear !== undefined && start.year !== filterYear) return null;
    return `Q${start.quarter}`;
  }
  
  // Both dates exist
  if (start && end) {
    // If filtering by year, get quarters for that year only
    if (filterYear !== undefined) {
      const startQ = start.year === filterYear ? start.quarter : (start.year < filterYear ? 1 : 5);
      const endQ = end.year === filterYear ? end.quarter : (end.year > filterYear ? 4 : 0);
      
      if (startQ > 4 || endQ < 1) return null;
      
      const actualStartQ = Math.max(1, startQ);
      const actualEndQ = Math.min(4, endQ);
      
      if (actualStartQ === actualEndQ) {
        return `Q${actualStartQ}`;
      }
      return `Q${actualStartQ}-Q${actualEndQ}`;
    }
    
    // No year filter - get pattern across all years
    // For multi-year, show the full range
    if (start.year !== end.year) {
      // Multi-year project - show Q1-Q4 as it spans multiple years
      return `Q${start.quarter}-Q${end.quarter}`;
    }
    
    // Same year
    if (start.quarter === end.quarter) {
      return `Q${start.quarter}`;
    }
    return `Q${start.quarter}-Q${end.quarter}`;
  }
  
  return null;
}

export function getQuarterKey(startDate: string | null | undefined, dueDate: string | null | undefined): string {
  const quarterBadge = formatQuarterBadge(startDate, dueDate);
  return quarterBadge || 'No Quarter';
}

export function sortQuarterKeys(quarterKeys: string[]): string[] {
  // Separate "No Quarter" from dated quarters
  const noQuarter = quarterKeys.filter(q => q === 'No Quarter');
  const datedQuarters = quarterKeys.filter(q => q !== 'No Quarter');
  
  // Sort dated quarters by extracting year and quarter
  datedQuarters.sort((a, b) => {
    // Extract first year and quarter from strings like "Q1 2025" or "Q1-Q2 2025" or "Q1 2025 - Q2 2026"
    const extractFirstQuarter = (str: string) => {
      const match = str.match(/Q(\d+)\s+(\d{4})/);
      if (match) {
        return { quarter: parseInt(match[1]), year: parseInt(match[2]) };
      }
      return { quarter: 0, year: 0 };
    };
    
    const aData = extractFirstQuarter(a);
    const bData = extractFirstQuarter(b);
    
    // Sort by year first, then by quarter
    if (aData.year !== bData.year) {
      return aData.year - bData.year;
    }
    return aData.quarter - bData.quarter;
  });
  
  // Return sorted dated quarters first, then "No Quarter" at the end
  return [...datedQuarters, ...noQuarter];
}

/**
 * Format a date with quarter prefix
 * Returns object with quarter and date parts for custom styling
 */
/**
 * Get all quarters covered by a project's date range
 * Returns array of quarter numbers (1-4) that the project spans
 * For multi-year projects, returns quarters from all years
 */
export function getProjectQuarters(startDate: string | null | undefined, dueDate: string | null | undefined, filterYear?: number): number[] {
  const start = getQuarter(startDate);
  const end = getQuarter(dueDate);
  
  if (!start && !end) return [];
  
  // If only one date exists
  if (!start && end) {
    // If filterYear is provided, only return quarter if it matches the year
    if (filterYear !== undefined && end.year !== filterYear) return [];
    return [end.quarter];
  }
  if (start && !end) {
    // If filterYear is provided, only return quarter if it matches the year
    if (filterYear !== undefined && start.year !== filterYear) return [];
    return [start.quarter];
  }
  
  // Both dates exist
  if (start && end) {
    const quarters: number[] = [];
    
    // If filter year is provided, only consider quarters from that year
    if (filterYear !== undefined) {
      // Check if the project spans into the filter year
      if (start.year <= filterYear && end.year >= filterYear) {
        // Determine which quarters to include
        const startQuarter = start.year === filterYear ? start.quarter : 1;
        const endQuarter = end.year === filterYear ? end.quarter : 4;
        
        for (let q = startQuarter; q <= endQuarter; q++) {
          if (!quarters.includes(q)) {
            quarters.push(q);
          }
        }
      }
    } else {
      // No year filter - get all quarters from start to end
      // If same year, just get quarters in between
      if (start.year === end.year) {
        for (let q = start.quarter; q <= end.quarter; q++) {
          quarters.push(q);
        }
      } else {
        // Multi-year: get all quarters from all years
        // Start year: from start quarter to Q4
        for (let q = start.quarter; q <= 4; q++) {
          if (!quarters.includes(q)) quarters.push(q);
        }
        
        // Middle years: all quarters
        for (let year = start.year + 1; year < end.year; year++) {
          for (let q = 1; q <= 4; q++) {
            if (!quarters.includes(q)) quarters.push(q);
          }
        }
        
        // End year: from Q1 to end quarter
        for (let q = 1; q <= end.quarter; q++) {
          if (!quarters.includes(q)) quarters.push(q);
        }
      }
    }
    
    return quarters.sort((a, b) => a - b);
  }
  
  return [];
}

export function formatDateWithQuarter(dateString: string | null | undefined): { quarter: string; date: string; full: string } | string {
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    return '-';
  }
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    // Get quarter info
    const quarterInfo = getQuarter(dateString);
    if (!quarterInfo) {
      return '-';
    }
    
    // Format the date part
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Return object with separate parts for styling
    return {
      quarter: `Q${quarterInfo.quarter}`,
      date: formattedDate,
      full: `Q${quarterInfo.quarter} ${formattedDate}`
    };
  } catch (error) {
    console.warn('Error formatting date with quarter:', dateString, error);
    return '-';
  }
}
