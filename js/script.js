// Neural network background animation
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Position canvas as background
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1"; // Behind all content
  canvas.style.pointerEvents = "none"; // Doesn't block interaction
  document.body.prepend(canvas);

  // Adjust resolution on resize
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Node settings
  const nodes = [];
  const nodeCount = 50; // Adjust for density
  const maxDistance = 150; // Max distance for connecting lines

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 4 + 2, // radius
      dx: (Math.random() - 0.5) * 0.7, // velocity X
      dy: (Math.random() - 0.5) * 0.7, // velocity Y
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(130, 205, 255, ${1 - dist / maxDistance})`;
          ctx.lineWidth = 1;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (let n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2, false);
      ctx.fillStyle = "rgba(130, 205, 255, 0.9)";
      ctx.fill();

      // Update position
      n.x += n.dx;
      n.y += n.dy;

      // Bounce off walls
      if (n.x < 0 || n.x > canvas.width) n.dx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.dy *= -1;
    }

    requestAnimationFrame(draw);
  }

  draw();
});
