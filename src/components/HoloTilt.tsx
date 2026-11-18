import { useRef, type ReactNode } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

interface HoloTiltProps {
  children: ReactNode;
  /** Max tilt in degrees at the card edge. */
  intensity?: number;
  /** Corner radius of the card so the foil/glare are clipped to it. */
  radius?: number;
  /** Gently sways on its own when nobody is touching it (great on a projector). */
  idle?: boolean;
  className?: string;
}

/**
 * Pokemon-style holographic card: 3D tilt toward the pointer, a rainbow foil that
 * slides with the angle, and a soft glare that follows the cursor.
 */
export function HoloTilt({ children, intensity = 14, radius = 12, idle = true, className }: HoloTiltProps) {
  const reduced = useReducedMotion();
  const hovering = useRef(false);

  // Normalised pointer position, -0.5 .. 0.5
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 16, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 140, damping: 16, mass: 0.6 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-intensity, intensity]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [intensity, -intensity]);

  const gx = useTransform(sx, [-0.5, 0.5], [0, 100]);
  const gy = useTransform(sy, [-0.5, 0.5], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.62), rgba(255,255,255,0.12) 28%, transparent 56%)`;
  const foilShift = useTransform(sx, [-0.5, 0.5], [0, 100]);
  const foilShiftY = useTransform(sy, [-0.5, 0.5], [0, 100]);
  const foilPos = useMotionTemplate`${foilShift}% ${foilShiftY}%`;

  useAnimationFrame((t) => {
    if (reduced || !idle || hovering.current) return;
    px.set(Math.sin(t / 1700) * 0.32);
    py.set(Math.cos(t / 2300) * 0.26);
  });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    hovering.current = true;
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    hovering.current = false;
    if (!idle || reduced) {
      px.set(0);
      py.set(0);
    }
  };

  return (
    <div
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={className}
      style={{ perspective: 1100 }}
    >
      <motion.div
        style={{
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          // Static glow: animating box-shadow repaints every frame, so it stays fixed.
          boxShadow: '0 24px 60px rgba(0, 212, 255, 0.22)',
          borderRadius: radius,
        }}
        className="relative will-change-transform"
      >
        {children}

        {/* Rainbow foil */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-color-dodge opacity-[0.34]"
          style={{
            borderRadius: radius,
            backgroundImage:
              'linear-gradient(115deg, transparent 18%, rgba(255,0,128,0.55) 30%, rgba(255,220,0,0.5) 40%, rgba(0,255,170,0.55) 50%, rgba(0,160,255,0.6) 60%, rgba(160,0,255,0.5) 70%, transparent 82%)',
            backgroundSize: '260% 260%',
            backgroundPosition: foilPos,
          }}
        />
        {/* Glare */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ borderRadius: radius, backgroundImage: glare }}
        />
      </motion.div>
    </div>
  );
}
