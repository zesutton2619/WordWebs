// Game state image generation for Discord sharing

export function generateGameStateImage(
  guesses,
  solvedGroups,
  playerInfo,
  puzzleNumber,
  attemptsRemaining = 4
) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 250;
    canvas.height = 200;

    // Background
    ctx.fillStyle = "#0f172a"; // Dark slate background like your game
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // WordWebs difficulty colors (matching your new scheme)
    const colors = {
      1: "#16a34a", // Green (Level 1)
      2: "#ca8a04", // Yellow (Level 2)
      3: "#ea580c", // Orange (Level 3)
      4: "#dc2626", // Red (Level 4)
      wrong: "#64748b", // Gray for wrong guesses
      empty: "#374151", // Dark gray for empty slots
    };

    // Helper function to draw rounded rectangle
    function roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    // Add title text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Word Webs #${puzzleNumber}`, canvas.width / 2, 25);

    // Add player name
    ctx.font = "9px Arial";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(playerInfo.username || "Player", canvas.width / 2, 40);

    let currentY = 55;
    const rowHeight = 22;
    const rowPadding = 4;

    // Calculate consistent width based on 4 words grid
    const gridSize = 20;
    const gridPadding = 3;
    const wordsPerRow = 4;
    const gridWidth = wordsPerRow * gridSize + (wordsPerRow - 1) * gridPadding;
    const gridStartX = (canvas.width - gridWidth) / 2;

    // First, draw solved groups as horizontal rows (like the actual game)
    const sortedSolvedGroups = [...solvedGroups].sort(
      (a, b) => a.difficulty - b.difficulty
    );

    for (let i = 0; i < sortedSolvedGroups.length; i++) {
      // Draw group row background (same width as grid)
      ctx.fillStyle = colors[sortedSolvedGroups[i].difficulty];
      roundRect(ctx, gridStartX, currentY, gridWidth, rowHeight, 4);
      ctx.fill();

      currentY += rowHeight + rowPadding;
    }

    // Draw remaining words grid (like the actual game)
    const totalWords = 16;
    const solvedWords = solvedGroups.reduce((count) => count + 4, 0);
    const remainingWords = totalWords - solvedWords;

    if (remainingWords > 0) {
      currentY += 2; // Reduced spacing between groups and grid

      const rows = Math.ceil(remainingWords / wordsPerRow);

      // Draw grid representing remaining words
      for (let i = 0; i < remainingWords; i++) {
        const row = Math.floor(i / wordsPerRow);
        const col = i % wordsPerRow;
        const x = gridStartX + col * (gridSize + gridPadding);
        const y = currentY + row * (gridSize + gridPadding);

        // Show remaining words as dark gray boxes
        ctx.fillStyle = colors.empty;
        roundRect(ctx, x, y, gridSize, gridSize, 3);
        ctx.fill();

        // Add subtle border
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 0.75;
        roundRect(ctx, x, y, gridSize, gridSize, 3);
        ctx.stroke();
      }

      currentY += rows * (gridSize + gridPadding) + 10;
    }

    // Add completion status
    let statusText = "";
    let statusColor = "#cbd5e1";

    if (solvedGroups.length === 4) {
      statusText = "🎉 Completed!";
      statusColor = "#22c55e";
    } else if (guesses.length >= 4 && solvedGroups.length < 4) {
      statusText = "💔 Failed";
      statusColor = "#ef4444";
    } else {
      statusText = `${solvedGroups.length}/4 groups found`;
      statusColor = "#cbd5e1";
    }

    // Add dots for attempts remaining (like the actual game)
    if (solvedGroups.length < 4) {
      const dotSize = 4;
      const dotSpacing = 8;
      const totalDots = 4;
      const dotsWidth = (totalDots - 1) * dotSpacing + dotSize;
      const dotsStartX = (canvas.width - dotsWidth) / 2;
      const dotsY = currentY + 15;

      for (let i = 0; i < totalDots; i++) {
        const dotX = dotsStartX + i * dotSpacing;

        // White dot for remaining attempts, gray dot for used attempts
        if (i < attemptsRemaining) {
          ctx.fillStyle = "#ffffff"; // White for remaining attempts
        } else {
          ctx.fillStyle = "#64748b"; // Gray for used attempts
        }

        ctx.beginPath();
        ctx.arc(
          dotX + dotSize / 2,
          dotsY + dotSize / 2,
          dotSize / 2,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    }

    // Add completion status text below dots
    ctx.fillStyle = statusColor;
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(statusText, canvas.width / 2, currentY + 35);

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL("image/png");
    resolve(dataURL);
  });
}

// Function to convert data URL to blob for Discord upload
export async function dataURLToBlob(dataURL) {
  const response = await fetch(dataURL);
  return await response.blob();
}
