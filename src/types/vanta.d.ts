declare module 'vanta/dist/vanta.net.min' {
  import { Object3D } from 'three';

  interface VantaNetOptions {
    el: HTMLElement | null;
    THREE: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
  }

  interface VantaEffect extends Object3D {
    destroy: () => void;
  }

  function NET(options: VantaNetOptions): VantaEffect;
  export default NET;
}

declare module 'vanta/dist/vanta.dots.min' {
  import { Object3D } from 'three';

  interface VantaDotsOptions {
    el: HTMLElement | null;
    THREE: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    backgroundColor?: number;
    color?: number;
    color2?: number;
    size?: number;
    spacing?: number;
    showLines?: boolean;
  }

  interface VantaEffect extends Object3D {
    destroy: () => void;
  }

  function DOTS(options: VantaDotsOptions): VantaEffect;
  export default DOTS;
} 