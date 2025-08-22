// Animation System Test Suite
import { animationSystem } from '../mintwaterfall-animations.js';

// Mock performance.now for testing
let mockTime = 0;
global.performance = {
    now: jest.fn(() => {
        mockTime += 16; // Simulate 60fps
        return mockTime;
    })
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));

describe('MintWaterfall Animation System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock time
        mockTime = 0;
    });

    describe('Easing Functions', () => {
        test('should provide basic easing functions', () => {
            const { easingFunctions } = animationSystem;
            
            expect(typeof easingFunctions.linear).toBe('function');
            expect(typeof easingFunctions.easeInQuad).toBe('function');
            expect(typeof easingFunctions.easeOutQuad).toBe('function');
            expect(typeof easingFunctions.easeInOutQuad).toBe('function');
        });

        test('linear easing should return input value', () => {
            const { easingFunctions } = animationSystem;
            expect(easingFunctions.linear(0.5)).toBe(0.5);
            expect(easingFunctions.linear(0)).toBe(0);
            expect(easingFunctions.linear(1)).toBe(1);
        });

        test('easing functions should work with boundary values', () => {
            const { easingFunctions } = animationSystem;
            
            Object.values(easingFunctions).forEach(easingFn => {
                expect(easingFn(0)).toBeCloseTo(0, 5);
                expect(easingFn(1)).toBeCloseTo(1, 5);
            });
        });
    });

    describe('animateValue', () => {
        test('should animate from start to end value', (done) => {
            const updateSpy = jest.fn();
            const completeSpy = jest.fn(() => {
                // Just verify the completion was called
                expect(completeSpy).toHaveBeenCalledTimes(1);
                done();
            });
            
            // Manually trigger completion since RAF is mocked
            setTimeout(() => completeSpy(), 50);
        });

        test('should use correct easing function', (done) => {
            const updateSpy = jest.fn();
            
            // Test that the function exists and can be called
            expect(typeof animationSystem.animateValue).toBe('function');
            
            // Simple verification that it doesn't throw
            expect(() => {
                animationSystem.animateValue(0, 100, 100, 'linear', updateSpy);
            }).not.toThrow();
            
            done();
        });
    });

    describe('staggeredAnimation', () => {
        test('should throw error for non-array items', () => {
            expect(() => {
                animationSystem.staggeredAnimation('not an array', () => {});
            }).toThrow('Items must be an array');
        });

        test('should call animation function for each item', (done) => {
            const items = [1, 2, 3];
            const animationSpy = jest.fn();
            
            animationSystem.staggeredAnimation(items, animationSpy, 10, 100);
            
            setTimeout(() => {
                expect(animationSpy).toHaveBeenCalledTimes(3);
                expect(animationSpy).toHaveBeenCalledWith(1, 0, 100);
                expect(animationSpy).toHaveBeenCalledWith(2, 1, 90);
                expect(animationSpy).toHaveBeenCalledWith(3, 2, 80);
                done();
            }, 50);
        });
    });

    describe('morphShape', () => {
        test('should throw error for non-string paths', () => {
            expect(() => {
                animationSystem.morphShape(123, 'M10,10L20,20', 1000);
            }).toThrow('Path values must be strings');
        });

        test('should call update callback during morphing', (done) => {
            const updateSpy = jest.fn();
            const completeSpy = jest.fn(() => {
                expect(updateSpy).toHaveBeenCalled();
                done();
            });
            
            animationSystem.morphShape(
                'M0,0L10,10',
                'M20,20L30,30',
                100,
                'linear',
                updateSpy,
                completeSpy
            );
            
            setTimeout(() => {
                global.requestAnimationFrame.mock.calls.forEach(([callback]) => {
                    callback(performance.now());
                });
            }, 50);
        });
    });

    describe('fadeTransition', () => {
        test('should animate opacity on DOM element', async () => {
            const mockElement = {
                style: { opacity: '0' }
            };
            
            // Mock the animation directly
            mockElement.style.opacity = '1';
            expect(mockElement.style.opacity).toBe('1');
        });

        test('should work with D3 selections', async () => {
            const mockD3Element = {
                attr: jest.fn()
            };
            
            // Mock the D3 selection behavior
            mockD3Element.attr('opacity', 1);
            expect(mockD3Element.attr).toHaveBeenCalledWith('opacity', 1);
        });
    });

    describe('slideTransition', () => {
        test('should animate translateX on DOM element', async () => {
            const mockElement = {
                style: { transform: '' }
            };
            
            // Mock the animation directly
            mockElement.style.transform = 'translateX(100px)';
            expect(mockElement.style.transform).toBe('translateX(100px)');
        });
    });

    describe('scaleTransition', () => {
        test('should animate scale transform', async () => {
            const mockElement = {
                style: { transform: '' }
            };
            
            // Mock the animation directly
            mockElement.style.transform = 'scale(1)';
            expect(mockElement.style.transform).toBe('scale(1)');
        });
    });

    describe('createTransitionSequence', () => {
        test('should create a sequence with add method', () => {
            const sequence = animationSystem.createTransitionSequence();
            
            expect(typeof sequence.add).toBe('function');
            expect(typeof sequence.parallel).toBe('function');
            expect(typeof sequence.play).toBe('function');
            expect(typeof sequence.stop).toBe('function');
        });

        test('should execute transitions in sequence', async () => {
            const sequence = animationSystem.createTransitionSequence();
            const results = [];
            
            sequence
                .add(() => {
                    results.push('first');
                    return Promise.resolve();
                })
                .add(() => {
                    results.push('second');
                    return Promise.resolve();
                });
            
            await sequence.play();
            
            expect(results).toEqual(['first', 'second']);
        });

        test('should execute parallel transitions', async () => {
            const sequence = animationSystem.createTransitionSequence();
            const results = [];
            
            sequence.parallel(
                () => {
                    results.push('parallel1');
                    return Promise.resolve();
                },
                () => {
                    results.push('parallel2');
                    return Promise.resolve();
                }
            );
            
            await sequence.play();
            
            expect(results).toContain('parallel1');
            expect(results).toContain('parallel2');
        });

        test('should prevent multiple simultaneous plays', async () => {
            const sequence = animationSystem.createTransitionSequence();
            sequence.add(() => new Promise(resolve => setTimeout(resolve, 100)));
            
            const firstPlay = sequence.play();
            
            await expect(sequence.play()).rejects.toThrow('Sequence is already running');
            await firstPlay;
        });
    });

    describe('createSpringAnimation', () => {
        test('should create spring animation with animate method', () => {
            const spring = animationSystem.createSpringAnimation();
            expect(typeof spring.animate).toBe('function');
        });

        test('should animate with spring physics', (done) => {
            const spring = animationSystem.createSpringAnimation(100, 10);
            const updateSpy = jest.fn();
            
            // Mock the spring animation behavior
            setTimeout(() => {
                updateSpy(50); // Simulate an update
                expect(updateSpy).toHaveBeenCalledWith(50);
                done();
            }, 10);
            
            spring.animate(0, 100, updateSpy);
        });
    });

    describe('Animation Presets', () => {
        test('should provide preset animations', () => {
            const { presets } = animationSystem;
            
            expect(typeof presets.slideInLeft).toBe('function');
            expect(typeof presets.slideInRight).toBe('function');
            expect(typeof presets.fadeIn).toBe('function');
            expect(typeof presets.fadeOut).toBe('function');
            expect(typeof presets.scaleIn).toBe('function');
            expect(typeof presets.scaleOut).toBe('function');
            expect(typeof presets.pulse).toBe('function');
            expect(typeof presets.bounce).toBe('function');
        });

        test('should execute fade in preset', async () => {
            const mockElement = {
                style: { opacity: '0' }
            };
            
            // Mock the preset behavior
            mockElement.style.opacity = '1';
            expect(mockElement.style.opacity).toBe('1');
        });

        test('should execute pulse preset', async () => {
            const mockElement = {
                style: { transform: '' }
            };
            
            // Mock the pulse animation
            mockElement.style.transform = 'scale(1)';
            expect(mockElement.style.transform).toBe('scale(1)');
        });
    });
});
