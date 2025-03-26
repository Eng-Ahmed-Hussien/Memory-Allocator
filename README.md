## **Contiguous Memory Allocator**

### **1. Overview**
This project demonstrates how an **operating system** might manage memory contiguously. Each **process** is allocated a single, continuous block of memory. The simulation supports **initializing** a memory region, **allocating** blocks based on different strategies, **releasing** memory, **compacting** free space, and **reporting** memory usage and fragmentation.

### **2. Data Structures**

1. **Memory Array**  
   An array (or list) of **block objects**, each containing:
   - **size** (number): The size of this block in KB.  
   - **allocated** (boolean): Whether the block is currently in use.  
   - **process** (string|null): The process ID if allocated, or `null` if free.

   Example block:
   ```js
   {
     size: 100,        // size in KB
     allocated: true,  // block in use
     process: "p1"     // process name
   }
   ```

2. **Global Variables**  
   - **`memory`**: The main array storing the block objects.  
   - **`totalMemorySize`**: The total memory (in KB) specified by the user.  
   - **`nextFitIndex`**: Used by the **Next Fit** strategy to track where to continue searching.  
   - **`scaleFactor`**: Controls how the memory stack is visually scaled (for display purposes).

### **3. Core Algorithms**

1. **Initialization**  
   - The user enters a total size, which is stored in `totalMemorySize`.  
   - `memory` is reset to a single free block of that size.  
   - This simulates having one contiguous region of free memory at the start.

2. **Allocation Strategies**  
   The simulator supports four allocation algorithms, each searching `memory` for a suitable free block:

   - **First Fit**  
     Scans from the beginning of `memory` to find the **first** free block that can accommodate the requested size.
   - **Next Fit**  
     Continues searching from the **last allocation position** (`nextFitIndex`), wrapping around if needed, to find a free block.
   - **Best Fit**  
     Scans all free blocks to find the **smallest** one that can accommodate the request (minimizing leftover space).
   - **Worst Fit**  
     Scans all free blocks to find the **largest** one (maximizing leftover space).

   **Splitting a Block**  
   - If a free block is larger than requested, it is **split** into two blocks: one allocated block of the requested size, and a smaller free block with the leftover space.

3. **Release & Merging**  
   - When a process is released (by name), that block is marked `allocated = false`.  
   - Adjacent free blocks are **merged** automatically to reduce external fragmentation.  
     ```js
     function mergeFreeBlocks() {
       // merges consecutive free blocks in 'memory'
     }
     ```

4. **Compaction**  
   - A manual operation that **merges all free blocks** into one large block, effectively simulating a memory “defragmentation” or “compaction” step.  
   - Internally calls `mergeFreeBlocks()` until all free blocks are consolidated.

5. **Reporting**  
   - Calculates **allocated** vs. **free** memory, **largest free block**, **number of holes**, and **percentage of free memory**.  
   - Helps visualize fragmentation and memory usage.

### **4. Process Flow**

1. **Initialize Memory**  
   - User sets `initSize` → Creates one large free block → Display updated.

2. **Allocate**  
   - User specifies process name, size, and allocation strategy.  
   - The chosen strategy scans `memory`.  
   - If found, the block is **split** if necessary; otherwise, an error is reported.

3. **Release**  
   - User enters a process name → That block is freed (`allocated = false`).  
   - **mergeFreeBlocks()** merges it with adjacent free blocks.

4. **Compact**  
   - Manually triggers a merge of **all** free blocks into a single block, if possible.

5. **Show Report**  
   - Summarizes memory usage, fragmentation, and free block statistics.

### **5. Fragmentation & Compaction**

- **External Fragmentation**  
  Occurs if multiple small free blocks exist between allocated blocks.  
  Releasing and merging helps, but leftover blocks can still remain scattered.  
- **Internal Fragmentation**  
  Occurs if an allocated block is slightly larger than requested (though in this simulator, blocks are split precisely, minimizing internal fragmentation).  
- **Compaction**  
  The user can manually trigger compaction to unify all free blocks. This simulates the costlier operation in real OSs where processes are physically moved in memory.

### **6. Potential Enhancements**

- **Buddy System**  
  Instead of arbitrary splits, manage memory in powers-of-two blocks for faster merges.  
- **Paging**  
  Simulate a non-contiguous approach for deeper OS insights (beyond contiguous allocation).  
- **Performance Simulation**  
  Introduce artificial “delays” or CPU usage metrics for each operation to approximate real overhead.  
- **Historical Logging**  
  Keep a record of allocation/release events with timestamps, enabling advanced analytics or replays.

### **7. Usage Example**

1. **Initialize** memory to 500 KB.  
2. **Allocate** process “p1” 100 KB using **Best Fit**.  
3. **Allocate** process “p2” 50 KB using **Next Fit**.  
4. **Release** process “p1” → Freed block merges with adjacent free block.  
5. **Compact** to unify all free blocks.  
6. **Show Report** for an overview of free/allocated memory.

### 7. Code Repository

You can check our complete project code repository for the Contiguous Memory Allocator below:

[**You Can Check our Contiguous Memory Allocator From here**]([https://github.com/yourusername/ContiguousMemoryAllocator](https://github.com/Eng-Ahmed-Hussien/Adv_OS_Task1))

### **8. Conclusion**

This simulator demonstrates the **core logic** of a **contiguous memory allocator**. By exploring **First Fit**, **Next Fit**, **Best Fit**, and **Worst Fit**, and seeing how blocks are split, merged, and compacted, users gain insight into the challenges of external fragmentation and the trade-offs inherent in each strategy.

