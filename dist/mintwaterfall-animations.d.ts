export interface EasingFunction {
    (t: number): number;
}
export interface EasingFunctions {
    linear: EasingFunction;
    easeInQuad: EasingFunction;
    easeOutQuad: EasingFunction;
    easeInOutQuad: EasingFunction;
    easeInCubic: EasingFunction;
    easeOutCubic: EasingFunction;
    easeInOutCubic: EasingFunction;
    easeInSine: EasingFunction;
    easeOutSine: EasingFunction;
    easeInOutSine: EasingFunction;
    easeInElastic: EasingFunction;
    easeOutElastic: EasingFunction;
    easeOutBounce: EasingFunction;
}
export interface TransitionConfig {
    staggerDelay: number;
    defaultDuration: number;
    defaultEase: keyof EasingFunctions;
}
export interface AnimationOptions {
    delay?: number;
    duration?: number;
    ease?: keyof EasingFunctions;
    reverse?: boolean;
}
export interface TransitionStep {
    fn: () => Promise<any>;
    delay: number;
}
export interface TransitionSequence {
    add(transitionFn: () => Promise<any>, delay?: number): TransitionSequence;
    parallel(...transitionFns: (() => Promise<any>)[]): TransitionSequence;
    play(): Promise<void>;
    stop(): void;
    readonly isRunning: boolean;
}
export interface SpringAnimation {
    animate(startValue: number, endValue: number, onUpdate?: (value: number) => void, onComplete?: () => void): void;
}
export interface TransitionWithEvents {
    start(): TransitionWithEvents;
    interrupt(): TransitionWithEvents;
    then(callback?: () => void): TransitionWithEvents;
}
export interface TransitionEventConfig {
    duration?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onInterrupt?: () => void;
}
export interface AnimationPresets {
    slideInLeft(element: any, duration?: number): Promise<void>;
    slideInRight(element: any, duration?: number): Promise<void>;
    fadeIn(element: any, duration?: number): Promise<void>;
    fadeOut(element: any, duration?: number): Promise<void>;
    scaleIn(element: any, duration?: number): Promise<void>;
    scaleOut(element: any, duration?: number): Promise<void>;
    pulse(element: any, duration?: number): Promise<void>;
    bounce(element: any, duration?: number): Promise<void>;
}
export interface AnimationSystem {
    easingFunctions: EasingFunctions;
    animateValue(startValue: number, endValue: number, duration: number, easingType?: keyof EasingFunctions, onUpdate?: (value: number, progress: number) => void, onComplete?: () => void): void;
    staggeredAnimation(items: any[], animationFn: (item: any, index: number, duration: number) => void, staggerDelay?: number, totalDuration?: number): void;
    morphShape(fromPath: string, toPath: string, duration?: number, easingType?: keyof EasingFunctions, onUpdate?: (path: string, progress: number) => void, onComplete?: () => void): void;
    fadeTransition(element: any, fromOpacity: number, toOpacity: number, duration?: number, easingType?: keyof EasingFunctions): Promise<void>;
    slideTransition(element: any, fromX: number, toX: number, duration?: number, easingType?: keyof EasingFunctions): Promise<void>;
    scaleTransition(element: any, fromScale: number, toScale: number, duration?: number, easingType?: keyof EasingFunctions): Promise<void>;
    createTransitionSequence(): TransitionSequence;
    createSpringAnimation(tension?: number, friction?: number): SpringAnimation;
    createStaggeredTransition(elements: any[] | NodeListOf<Element>, animationFn: (element: any, duration: number, ease: keyof EasingFunctions) => Promise<any>, options?: AnimationOptions): Promise<any[]>;
    createCustomTween(startValue: number, endValue: number, interpolator?: (start: number, end: number, t: number) => number): (t: number) => number;
    createTransitionWithEvents(element: any, config: TransitionEventConfig): TransitionWithEvents;
    transitionConfig: TransitionConfig;
    presets: AnimationPresets;
}
export declare function createAnimationSystem(): AnimationSystem;
export declare const animationSystem: AnimationSystem;
//# sourceMappingURL=mintwaterfall-animations.d.ts.map