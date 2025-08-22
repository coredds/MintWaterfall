// MintWaterfall Animation and Transitions System
// Provides smooth animations and transitions for chart updates

export function createAnimationSystem() {
    
    // Advanced transition configuration
    const transitionConfig = {
        staggerDelay: 100,      // Default stagger delay between elements
        defaultDuration: 750,   // Default animation duration
        defaultEase: "easeOutQuad"
    };
    
    function createEasingFunctions() {
        return {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
            easeOutSine: t => Math.sin(t * Math.PI / 2),
            easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
            easeInElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
            },
            easeOutElastic: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            easeOutBounce: t => {
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
    
    function animateValue(startValue, endValue, duration, easingType = "easeOutQuad", onUpdate, onComplete) {
        const startTime = performance.now();
        const valueRange = endValue - startValue;
        const easing = easingFunctions[easingType] || easingFunctions.easeOutQuad;
        
        function frame(currentTime) {
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
    
    function staggeredAnimation(items, animationFn, staggerDelay = 100, totalDuration = 1000) {
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
    
    function morphShape(fromPath, toPath, duration = 1000, easingType = "easeInOutQuad", onUpdate, onComplete) {
        // Simple path morphing for basic shapes
        // Note: In a real implementation, you'd want more sophisticated path interpolation
        
        if (typeof fromPath !== "string" || typeof toPath !== "string") {
            throw new Error("Path values must be strings");
        }
        
        const startTime = performance.now();
        const easing = easingFunctions[easingType] || easingFunctions.easeInOutQuad;
        
        function frame(currentTime) {
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
    
    function fadeTransition(element, fromOpacity, toOpacity, duration = 500, easingType = "easeOutQuad") {
        return new Promise((resolve) => {
            animateValue(
                fromOpacity,
                toOpacity,
                duration,
                easingType,
                (value) => {
                    if (element && element.style) {
                        element.style.opacity = value;
                    } else if (element && element.attr) {
                        // D3 selection
                        element.attr("opacity", value);
                    }
                },
                resolve
            );
        });
    }
    
    function slideTransition(element, fromX, toX, duration = 500, easingType = "easeOutQuad") {
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
                resolve
            );
        });
    }
    
    function scaleTransition(element, fromScale, toScale, duration = 500, easingType = "easeOutQuad") {
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
                resolve
            );
        });
    }
    
    function createTransitionSequence() {
        const sequence = [];
        let isRunning = false;
        
        function add(transitionFn, delay = 0) {
            sequence.push({ fn: transitionFn, delay });
            return this;
        }
        
        function parallel(...transitionFns) {
            sequence.push({
                fn: () => Promise.all(transitionFns.map(fn => fn())),
                delay: 0
            });
            return this;
        }
        
        async function play() {
            if (isRunning) {
                throw new Error("Sequence is already running");
            }
            
            isRunning = true;
            
            try {
                for (const step of sequence) {
                    if (step.delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, step.delay));
                    }
                    await step.fn();
                }
            } finally {
                isRunning = false;
            }
        }
        
        function stop() {
            isRunning = false;
            // Note: In a production system, you'd want to cancel running animations
        }
        
        return {
            add,
            parallel,
            play,
            stop,
            get isRunning() { return isRunning; }
        };
    }
    
    function createSpringAnimation(tension = 300, friction = 20) {
        // Simple spring physics implementation
        function animate(startValue, endValue, onUpdate, onComplete) {
            let position = startValue;
            let velocity = 0;
            let lastTime = performance.now();
            
            function frame(currentTime) {
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
    
    function createAnimationPresets() {
        return {
            slideInLeft: (element, duration = 500) => 
                slideTransition(element, -100, 0, duration, "easeOutQuad"),
            
            slideInRight: (element, duration = 500) => 
                slideTransition(element, 100, 0, duration, "easeOutQuad"),
            
            fadeIn: (element, duration = 500) => 
                fadeTransition(element, 0, 1, duration, "easeOutQuad"),
            
            fadeOut: (element, duration = 500) => 
                fadeTransition(element, 1, 0, duration, "easeOutQuad"),
            
            scaleIn: (element, duration = 500) => 
                scaleTransition(element, 0, 1, duration, "easeOutElastic"),
            
            scaleOut: (element, duration = 500) => 
                scaleTransition(element, 1, 0, duration, "easeInQuad"),
            
            pulse: (element, duration = 300) => {
                const sequence = createTransitionSequence();
                return sequence
                    .add(() => scaleTransition(element, 1, 1.1, duration / 2, "easeOutQuad"))
                    .add(() => scaleTransition(element, 1.1, 1, duration / 2, "easeInQuad"))
                    .play();
            },
            
            bounce: (element, duration = 600) => 
                scaleTransition(element, 0, 1, duration, "easeOutBounce")
        };
    }
    
    const presets = createAnimationPresets();
    
    // Advanced staggered animations
    function createStaggeredTransition(elements, animationFn, options = {}) {
        const {
            delay = transitionConfig.staggerDelay,
            duration = transitionConfig.defaultDuration,
            ease = transitionConfig.defaultEase,
            reverse = false
        } = options;
        
        const elementArray = Array.isArray(elements) ? elements : Array.from(elements);
        const orderedElements = reverse ? elementArray.reverse() : elementArray;
        
        return Promise.all(
            orderedElements.map((element, index) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        animationFn(element, duration, ease).then(resolve);
                    }, index * delay);
                });
            })
        );
    }
    
    // Custom tweening functions
    function createCustomTween(startValue, endValue, interpolator) {
        return function(t) {
            if (typeof interpolator === "function") {
                return interpolator(startValue, endValue, t);
            }
            // Default linear interpolation
            return startValue + (endValue - startValue) * t;
        };
    }
    
    // Transition event handlers
    function createTransitionWithEvents(element, config) {
        const {
            duration = transitionConfig.defaultDuration,
            onStart,
            onEnd,
            onInterrupt
        } = config;
        
        let isInterrupted = false;
        
        const transition = {
            start() {
                if (onStart) onStart();
                return this;
            },
            
            interrupt() {
                isInterrupted = true;
                if (onInterrupt) onInterrupt();
                return this;
            },
            
            then(callback) {
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
    
    return {
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
}

// Create a global animation system instance
export const animationSystem = createAnimationSystem();
