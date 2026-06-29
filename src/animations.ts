// MintWaterfall Animation and Transitions System - TypeScript Version
// Provides smooth animations and transitions for chart updates with full type safety

// Type definitions for animation system
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
    animate(
        startValue: number,
        endValue: number,
        onUpdate?: (value: number) => void,
        onComplete?: () => void
    ): void;
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
    animateValue(
        startValue: number,
        endValue: number,
        duration: number,
        easingType?: keyof EasingFunctions,
        onUpdate?: (value: number, progress: number) => void,
        onComplete?: () => void
    ): void;
    staggeredAnimation(
        items: any[],
        animationFn: (item: any, index: number, duration: number) => void,
        staggerDelay?: number,
        totalDuration?: number
    ): void;
    morphShape(
        fromPath: string,
        toPath: string,
        duration?: number,
        easingType?: keyof EasingFunctions,
        onUpdate?: (path: string, progress: number) => void,
        onComplete?: () => void
    ): void;
    fadeTransition(
        element: any,
        fromOpacity: number,
        toOpacity: number,
        duration?: number,
        easingType?: keyof EasingFunctions
    ): Promise<void>;
    slideTransition(
        element: any,
        fromX: number,
        toX: number,
        duration?: number,
        easingType?: keyof EasingFunctions
    ): Promise<void>;
    scaleTransition(
        element: any,
        fromScale: number,
        toScale: number,
        duration?: number,
        easingType?: keyof EasingFunctions
    ): Promise<void>;
    createTransitionSequence(): TransitionSequence;
    createSpringAnimation(tension?: number, friction?: number): SpringAnimation;
    createStaggeredTransition(
        elements: any[] | NodeListOf<Element>,
        animationFn: (element: any, duration: number, ease: keyof EasingFunctions) => Promise<any>,
        options?: AnimationOptions
    ): Promise<any[]>;
    createCustomTween(startValue: number, endValue: number, interpolator?: (start: number, end: number, t: number) => number): (t: number) => number;
    createTransitionWithEvents(element: any, config: TransitionEventConfig): TransitionWithEvents;
    transitionConfig: TransitionConfig;
    presets: AnimationPresets;
}

export function createAnimationSystem(): AnimationSystem {
    
    // Advanced transition configuration
    const transitionConfig: TransitionConfig = {
        staggerDelay: 100,      // Default stagger delay between elements
        defaultDuration: 750,   // Default animation duration
        defaultEase: "easeOutQuad"
    };
    
    function createEasingFunctions(): EasingFunctions {
        return {
            linear: (t: number) => t,
            easeInQuad: (t: number) => t * t,
            easeOutQuad: (t: number) => t * (2 - t),
            easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: (t: number) => t * t * t,
            easeOutCubic: (t: number) => (--t) * t * t + 1,
            easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInSine: (t: number) => 1 - Math.cos(t * Math.PI / 2),
            easeOutSine: (t: number) => Math.sin(t * Math.PI / 2),
            easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
            easeInElastic: (t: number) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
            },
            easeOutElastic: (t: number) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            easeOutBounce: (t: number) => {
                const n1 = 7.5625;
                const d1 = 2.75;
                
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            }
        };
    }
    
    const easingFunctions = createEasingFunctions();
    
    function animateValue(
        startValue: number,
        endValue: number,
        duration: number,
        easingType: keyof EasingFunctions = "easeOutQuad",
        onUpdate?: (value: number, progress: number) => void,
        onComplete?: () => void
    ): void {
        const startTime = performance.now();
        const valueRange = endValue - startValue;
        const easing = easingFunctions[easingType] || easingFunctions.easeOutQuad;
        
        function frame(currentTime: number): void {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = easing(progress);
            const currentValue = startValue + (valueRange * easedProgress);
            
            if (onUpdate) {
                onUpdate(currentValue, progress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(frame);
            } else if (onComplete) {
                onComplete();
            }
        }
        
        requestAnimationFrame(frame);
    }
    
    function staggeredAnimation(
        items: any[],
        animationFn: (item: any, index: number, duration: number) => void,
        staggerDelay: number = 100,
        totalDuration: number = 1000
    ): void {
        if (!Array.isArray(items)) {
            throw new Error("Items must be an array");
        }
        
        items.forEach((item, index) => {
            const delay = index * staggerDelay;
            const adjustedDuration = totalDuration - delay;
            
            setTimeout(() => {
                if (adjustedDuration > 0) {
                    animationFn(item, index, adjustedDuration);
                }
            }, delay);
        });
    }
    
    function morphShape(
        fromPath: string,
        toPath: string,
        duration: number = 1000,
        easingType: keyof EasingFunctions = "easeInOutQuad",
        onUpdate?: (path: string, progress: number) => void,
        onComplete?: () => void
    ): void {
        // Simple path morphing for basic shapes
        // Note: In a real implementation, you'd want more sophisticated path interpolation
        
        if (typeof fromPath !== "string" || typeof toPath !== "string") {
            throw new Error("Path values must be strings");
        }
        
        const startTime = performance.now();
        const easing = easingFunctions[easingType] || easingFunctions.easeInOutQuad;
        
        function frame(currentTime: number): void {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = easing(progress);
            
            // Simple interpolation - in production, use a proper path morphing library
            const interpolatedPath = progress < 0.5 ? fromPath : toPath;
            
            if (onUpdate) {
                onUpdate(interpolatedPath, easedProgress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(frame);
            } else if (onComplete) {
                onComplete();
            }
        }
        
        requestAnimationFrame(frame);
    }
    
    function fadeTransition(
        element: any,
        fromOpacity: number,
        toOpacity: number,
        duration: number = 500,
        easingType: keyof EasingFunctions = "easeOutQuad"
    ): Promise<void> {
        return new Promise((resolve) => {
            animateValue(
                fromOpacity,
                toOpacity,
                duration,
                easingType,
                (value) => {
                    if (element && element.style) {
                        element.style.opacity = value.toString();
                    } else if (element && element.attr) {
                        // D3 selection
                        element.attr("opacity", value);
                    }
                },
                () => resolve()
            );
        });
    }
    
    function slideTransition(
        element: any,
        fromX: number,
        toX: number,
        duration: number = 500,
        easingType: keyof EasingFunctions = "easeOutQuad"
    ): Promise<void> {
        return new Promise((resolve) => {
            animateValue(
                fromX,
                toX,
                duration,
                easingType,
                (value) => {
                    if (element && element.style) {
                        element.style.transform = `translateX(${value}px)`;
                    } else if (element && element.attr) {
                        // D3 selection
                        element.attr("transform", `translate(${value}, 0)`);
                    }
                },
                () => resolve()
            );
        });
    }
    
    function scaleTransition(
        element: any,
        fromScale: number,
        toScale: number,
        duration: number = 500,
        easingType: keyof EasingFunctions = "easeOutQuad"
    ): Promise<void> {
        return new Promise((resolve) => {
            animateValue(
                fromScale,
                toScale,
                duration,
                easingType,
                (value) => {
                    if (element && element.style) {
                        element.style.transform = `scale(${value})`;
                    } else if (element && element.attr) {
                        // D3 selection
                        element.attr("transform", `scale(${value})`);
                    }
                },
                () => resolve()
            );
        });
    }
    
    function createTransitionSequence(): TransitionSequence {
        const sequence: TransitionStep[] = [];
        let isRunning = false;
        
        function add(transitionFn: () => Promise<any>, delay: number = 0): TransitionSequence {
            sequence.push({ fn: transitionFn, delay });
            return transitionSequence;
        }
        
        function parallel(...transitionFns: (() => Promise<any>)[]): TransitionSequence {
            sequence.push({
                fn: () => Promise.all(transitionFns.map(fn => fn())),
                delay: 0
            });
            return transitionSequence;
        }
        
        async function play(): Promise<void> {
            if (isRunning) {
                throw new Error("Sequence is already running");
            }
            
            isRunning = true;
            
            try {
                for (const step of sequence) {
                    if (step.delay > 0) {
                        await new Promise<void>(resolve => setTimeout(resolve, step.delay));
                    }
                    await step.fn();
                }
            } finally {
                isRunning = false;
            }
        }
        
        function stop(): void {
            isRunning = false;
            // Note: In a production system, you'd want to cancel running animations
        }
        
        const transitionSequence: TransitionSequence = {
            add,
            parallel,
            play,
            stop,
            get isRunning() { return isRunning; }
        };
        
        return transitionSequence;
    }
    
    function createSpringAnimation(tension: number = 300, friction: number = 20): SpringAnimation {
        // Simple spring physics implementation
        function animate(
            startValue: number,
            endValue: number,
            onUpdate?: (value: number) => void,
            onComplete?: () => void
        ): void {
            let position = startValue;
            let velocity = 0;
            let lastTime = performance.now();
            
            function frame(currentTime: number): void {
                const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
                lastTime = currentTime;
                
                const displacement = position - endValue;
                const springForce = -tension * displacement;
                const dampingForce = -friction * velocity;
                
                const acceleration = springForce + dampingForce;
                velocity += acceleration * deltaTime;
                position += velocity * deltaTime;
                
                if (onUpdate) {
                    onUpdate(position);
                }
                
                // Check if animation should continue
                const isAtRest = Math.abs(displacement) < 0.01 && Math.abs(velocity) < 0.01;
                
                if (!isAtRest) {
                    requestAnimationFrame(frame);
                } else if (onComplete) {
                    onComplete();
                }
            }
            
            requestAnimationFrame(frame);
        }
        
        return { animate };
    }
    
    function createAnimationPresets(): AnimationPresets {
        return {
            slideInLeft: (element: any, duration: number = 500) => 
                slideTransition(element, -100, 0, duration, "easeOutQuad"),
            
            slideInRight: (element: any, duration: number = 500) => 
                slideTransition(element, 100, 0, duration, "easeOutQuad"),
            
            fadeIn: (element: any, duration: number = 500) => 
                fadeTransition(element, 0, 1, duration, "easeOutQuad"),
            
            fadeOut: (element: any, duration: number = 500) => 
                fadeTransition(element, 1, 0, duration, "easeOutQuad"),
            
            scaleIn: (element: any, duration: number = 500) => 
                scaleTransition(element, 0, 1, duration, "easeOutElastic"),
            
            scaleOut: (element: any, duration: number = 500) => 
                scaleTransition(element, 1, 0, duration, "easeInQuad"),
            
            pulse: (element: any, duration: number = 300) => {
                const sequence = createTransitionSequence();
                return sequence
                    .add(() => scaleTransition(element, 1, 1.1, duration / 2, "easeOutQuad"))
                    .add(() => scaleTransition(element, 1.1, 1, duration / 2, "easeInQuad"))
                    .play();
            },
            
            bounce: (element: any, duration: number = 600) => 
                scaleTransition(element, 0, 1, duration, "easeOutBounce")
        };
    }
    
    const presets = createAnimationPresets();
    
    // Advanced staggered animations
    function createStaggeredTransition(
        elements: any[] | NodeListOf<Element>,
        animationFn: (element: any, duration: number, ease: keyof EasingFunctions) => Promise<any>,
        options: AnimationOptions = {}
    ): Promise<any[]> {
        const {
            delay = transitionConfig.staggerDelay,
            duration = transitionConfig.defaultDuration,
            ease = transitionConfig.defaultEase,
            reverse = false
        } = options;
        
        const elementArray = Array.isArray(elements) ? elements : Array.from(elements);
        const orderedElements = reverse ? [...elementArray].reverse() : elementArray;
        
        return Promise.all(
            orderedElements.map((element, index) => {
                return new Promise<any>(resolve => {
                    setTimeout(() => {
                        animationFn(element, duration, ease).then(resolve);
                    }, index * delay);
                });
            })
        );
    }
    
    // Custom tweening functions
    function createCustomTween(
        startValue: number,
        endValue: number,
        interpolator?: (start: number, end: number, t: number) => number
    ): (t: number) => number {
        return function(t: number): number {
            if (typeof interpolator === "function") {
                return interpolator(startValue, endValue, t);
            }
            // Default linear interpolation
            return startValue + (endValue - startValue) * t;
        };
    }
    
    // Transition event handlers
    function createTransitionWithEvents(element: any, config: TransitionEventConfig): TransitionWithEvents {
        const {
            duration = transitionConfig.defaultDuration,
            onStart,
            onEnd,
            onInterrupt
        } = config;
        
        let isInterrupted = false;
        
        const transition: TransitionWithEvents = {
            start(): TransitionWithEvents {
                if (onStart) onStart();
                return this;
            },
            
            interrupt(): TransitionWithEvents {
                isInterrupted = true;
                if (onInterrupt) onInterrupt();
                return this;
            },
            
            then(callback?: () => void): TransitionWithEvents {
                if (!isInterrupted && onEnd) {
                    setTimeout(() => {
                        onEnd();
                        if (callback) callback();
                    }, duration);
                }
                return this;
            }
        };
        
        return transition;
    }
    
    const animationSystem: AnimationSystem = {
        easingFunctions,
        animateValue,
        staggeredAnimation,
        morphShape,
        fadeTransition,
        slideTransition,
        scaleTransition,
        createTransitionSequence,
        createSpringAnimation,
        createStaggeredTransition,
        createCustomTween,
        createTransitionWithEvents,
        transitionConfig,
        presets
    };
    
    return animationSystem;
}

// Create a global animation system instance
export const animationSystem = createAnimationSystem();
