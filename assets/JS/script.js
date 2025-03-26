// INITIALIZATION
// Initialize AOS library for scroll animations
AOS.init({ once: false });

// Enable Bootstrap tooltips for elements with data-bs-toggle="tooltip"
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// GLOBAL VARIABLES
let memory = [];                    // Array to store memory blocks
let totalMemorySize = 0;           // Total size of initialized memory
const scaleFactor = 2;             // Factor to adjust container height
let currentEditIndex = null;       // Index of block being edited
let nextFitIndex = 0;             // Tracking index for Next Fit algorithm

// MEMORY MANAGEMENT FUNCTIONS
// Initialize memory with user-specified size
function initializeMemory() {
  const initSize = parseInt(document.getElementById('initSize').value);
  if (!initSize || initSize < 1) {
    return showToast('Error', 'Please enter a valid memory size.', 'danger');
  }
  totalMemorySize = initSize;
  memory = [{ size: initSize, allocated: false, process: null }];
  document.getElementById('initSize').disabled = true;
  document.getElementById('initBtn').disabled = true;
  document.getElementById('allocationSection').style.display = 'block';
  document.getElementById('actionSection').style.display = 'block';
  const container = document.getElementById('memoryDisplay');
  container.style.height = Math.max(totalMemorySize / scaleFactor, 200) + 'px';
  showToast('Success', 'Memory initialized successfully!', 'success');
  renderMemory();
}

// Render memory blocks visually
function renderMemory() {
  const container = document.getElementById('memoryDisplay');
  container.innerHTML = '';
  memory.forEach((block, index) => {
    const div = document.createElement('div');
    div.classList.add('memory-block', block.allocated ? 'allocated' : 'free');
    div.style.height = (block.size / totalMemorySize * 100) + '%';
    if (block.isNew) {
      div.setAttribute('data-aos', 'fade-up');
      delete block.isNew;
    }
    div.innerHTML = block.allocated ? 
      `${block.process} (${block.size} KB)<i class="bi bi-pencil-square btn-edit" onclick="editBlock(${index})"></i>` :
      `Free (${block.size} KB)`;
    container.appendChild(div);
  });
  AOS.refresh();
}

// Allocate memory using selected strategy (first, next, best, worst)
function allocate() {
  const processName = document.getElementById('processName').value.trim();
  const processSize = parseInt(document.getElementById('processSize').value);
  const strategy = document.getElementById('strategy').value;
  
  if (!processName || !processSize || processSize < 1) 
    return showToast('Error', 'Invalid process name or size.', 'danger');
  if (memory.some(b => b.allocated && b.process === processName))
    return showToast('Error', 'Process name already exists.', 'danger');

  // Check if memory is full or insufficient
  const totalFree = memory.reduce((sum, block) => sum + (block.allocated ? 0 : block.size), 0);
  if (totalFree === 0) {
    return showToast('Warning', 'Memory is full - no free space available.', 'warning');
  }
  if (totalFree < processSize) {
    return showToast('Warning', 'Insufficient free memory for this process.', 'warning');
  }

  let candidateIndex = -1;
  if (strategy === 'first') {
    candidateIndex = memory.findIndex(block => !block.allocated && block.size >= processSize);
  } else if (strategy === 'next') {
    let n = memory.length;
    for (let i = 0; i < n; i++) {
      let idx = (nextFitIndex + i) % n;
      if (!memory[idx].allocated && memory[idx].size >= processSize) {
        candidateIndex = idx;
        nextFitIndex = (idx + 1) % n;
        break;
      }
    }
  } else {
    let bestFit = { index: -1, size: strategy === 'best' ? Infinity : -1 };
    memory.forEach((block, idx) => {
      if (!block.allocated && block.size >= processSize) {
        if ((strategy === 'best' && block.size < bestFit.size) ||
            (strategy === 'worst' && block.size > bestFit.size)) {
          bestFit = { index: idx, size: block.size };
        }
      }
    });
    candidateIndex = bestFit.index;
  }

  if (candidateIndex === -1)
    return showToast('Error', 'No suitable memory block found.', 'danger');

  let freeBlock = memory[candidateIndex];
  if (freeBlock.size === processSize) {
    freeBlock.allocated = true;
    freeBlock.process = processName;
    freeBlock.isNew = true;
  } else {
    memory.splice(candidateIndex, 1,
      { size: processSize, allocated: true, process: processName, isNew: true },
      { size: freeBlock.size - processSize, allocated: false, process: null }
    );
  }
  showToast('Success', `Process "${processName}" allocated successfully!`, 'success');
  renderMemory();
}

// Release memory block by process name
function releaseMemory() {
  const releaseName = document.getElementById('releaseProcess').value.trim();
  if (!releaseName)
    return showToast('Error', 'Enter a process name.', 'danger');
  
  let found = false;
  memory.forEach(block => {
    if (block.allocated && block.process === releaseName) {
      block.allocated = false;
      block.process = null;
      found = true;
    }
  });
  if (!found)
    return showToast('Error', 'Process not found.', 'danger');
  
  mergeFreeBlocks();
  showToast('Success', `Process "${releaseName}" released.`, 'success');
  renderMemory();
}

// Merge adjacent free memory blocks
function mergeFreeBlocks() {
  for (let i = 0; i < memory.length - 1;) {
    if (!memory[i].allocated && !memory[i+1].allocated) {
      memory[i].size += memory[i+1].size;
      memory.splice(i+1, 1);
    } else {
      i++;
    }
  }
}

// Compact memory by moving all allocated blocks together
function compactMemory() {
  let allocatedBlocks = memory.filter(block => block.allocated);
  let freeSize = memory.reduce((sum, block) => sum + (block.allocated ? 0 : block.size), 0);
  memory = [...allocatedBlocks, { size: freeSize, allocated: false, process: null }];
  showToast('Success', 'Memory compacted successfully!', 'success');
  renderMemory();
}

// EDITING FUNCTIONS
// Open edit modal for a memory block
function editBlock(index) {
  const block = memory[index];
  if (!block.allocated) return;
  currentEditIndex = index;
  document.getElementById('editProcessName').value = block.process;
  document.getElementById('editProcessSize').value = block.size;
  document.getElementById('editError').textContent = '';
  const modal = new bootstrap.Modal(document.getElementById('editModal'));
  modal.show();
}

// Save changes to an edited memory block
function saveEdit() {
  const newName = document.getElementById('editProcessName').value.trim();
  const newSize = parseInt(document.getElementById('editProcessSize').value);
  
  if (!newName || !newSize || newSize < 1) {
    document.getElementById('editError').textContent = 'Please enter valid values.';
    return;
  }
  if (memory.some((b, idx) => idx !== currentEditIndex && b.allocated && b.process === newName)) {
    document.getElementById('editError').textContent = 'Another process already has that name.';
    return;
  }

  let block = memory[currentEditIndex];
  const oldSize = block.size;
  if (newSize < oldSize) {
    block.size = newSize;
    memory.splice(currentEditIndex + 1, 0, { size: oldSize - newSize, allocated: false, process: null });
  } else if (newSize > oldSize) {
    if (memory[currentEditIndex + 1] && !memory[currentEditIndex + 1].allocated) {
      const freeBlock = memory[currentEditIndex + 1];
      const increase = newSize - oldSize;
      if (freeBlock.size >= increase) {
        block.size = newSize;
        freeBlock.size -= increase;
        if (freeBlock.size === 0) memory.splice(currentEditIndex + 1, 1);
      } else {
        document.getElementById('editError').textContent = 'Not enough free space to expand.';
        return;
      }
    } else {
      document.getElementById('editError').textContent = 'No adjacent free space available.';
      return;
    }
  }
  block.process = newName;
  showToast('Success', 'Block updated successfully!', 'success');
  renderMemory();
  const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
  modal.hide();
}

// UTILITY FUNCTIONS
// Reset entire memory system, with check for no changes
function resetAll() {
  const isInitialState = memory.length === 0 && 
                        totalMemorySize === 0 && 
                        !document.getElementById('initSize').disabled && 
                        !document.getElementById('initBtn').disabled && 
                        document.getElementById('allocationSection').style.display === 'none' && 
                        document.getElementById('actionSection').style.display === 'none';

  if (isInitialState) {
    showToast('Info', 'Nothing to reset - system is already in initial state.', 'info');
    return;
  }

  memory = [];
  totalMemorySize = 0;
  nextFitIndex = 0;
  document.getElementById('initSize').disabled = false;
  document.getElementById('initBtn').disabled = false;
  document.getElementById('allocationSection').style.display = 'none';
  document.getElementById('actionSection').style.display = 'none';
  document.getElementById('memoryDisplay').innerHTML = '';
  showToast('Success', 'System reset.', 'success');
}

// Display memory usage report
function showReport() {
  let totalAllocated = memory.reduce((sum, block) => block.allocated ? sum + block.size : sum, 0);
  let totalFree = memory.reduce((sum, block) => !block.allocated ? sum + block.size : sum, 0);
  let freeBlocks = memory.filter(block => !block.allocated);
  let numHoles = freeBlocks.length;
  let largestHole = freeBlocks.length ? Math.max(...freeBlocks.map(b => b.size)) : 0;
  let freePercent = totalMemorySize ? ((totalFree / totalMemorySize) * 100).toFixed(2) : 0;
  
  document.getElementById('reportBody').innerHTML = `
    <p><strong class="main-color">Total Memory:</strong> ${totalMemorySize} KB</p>
    <p><strong class="main-color">Total Allocated:</strong> ${totalAllocated} KB</p>
    <p><strong class="main-color">Total Free:</strong> ${totalFree} KB</p>
    <p><strong class="main-color">Free Memory (%):</strong> ${freePercent}%</p>
    <p><strong class="main-color">Number of Free Blocks (Holes):</strong> ${numHoles}</p>
    <p><strong class="main-color">Largest Free Block:</strong> ${largestHole} KB</p>
  `;
  const modal = new bootstrap.Modal(document.getElementById('reportModal'));
  modal.show();
}

// Show notification toast with custom background colors
function showToast(title, message, type) {
  const toast = document.createElement('div');
  toast.classList.add('toast', 'align-items-center', 'text-white', 'border-0');
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');

  // Define custom background colors for each type
  const colors = {
    success: 'rgb(105,240,175,0.908)',
danger: 'rgb(240,98,145,0.908)',
warning: 'rgb(255,241,118,0.908)',
info: 'rgb(144,202,249,0.908)'     
  };

  toast.style.backgroundColor = colors[type] || '#6C757D'; // Fallback to gray if type is undefined
  toast.innerHTML = `<div class="d-flex"><div class="toast-body text-dark">${title}: ${message}</div></div>`;
  document.querySelector('.toast-container').appendChild(toast);
  new bootstrap.Toast(toast).show();
  setTimeout(() => toast.remove(), 4000);
}

// UI INTERACTION
// Handle scroll-to-top button visibility
window.addEventListener('scroll', () => {
  const goTopBtn = document.getElementById('goTopBtn');
  goTopBtn.style.display = (document.documentElement.scrollTop > 100 || document.body.scrollTop > 100) ? 'flex' : 'none';
});

// Smooth scroll to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Animate header opacity on scroll
window.addEventListener('scroll', () => {
  const header = document.getElementById('topHeader');
  let opacity = 1 - (window.scrollY / 300);
  header.style.opacity = opacity < 0.5 ? 0.5 : opacity;
});