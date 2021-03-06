//---------------------------------//
// Visualisation Object            //
//---------------------------------//

window.Vis = window.Vis || {};

Vis.init = function() {
    Vis.isRunning = false;

    Vis.setup.initConsts();
    Vis.setup.initVars();
    Vis.setup.initCondition();

    Arrow.init(); // init arrows

    Vis.setup.initGraph();
    Vis.setup.initButton();
    Vis.setup.initSlider();

    Vis.start();
    //Vis.stop();
};

Vis.start = function() {
    if (Vis._stoptime) {
        Vis._then += Date.now() - Vis._stoptime; // add stopped time
    }

    if (!Vis.isRunning) {
        Vis.core.frame();
        Vis.isRunning = true;
    }
};

Vis.stop = function() {
    window.cancelAnimationFrame(Vis.animationFrameLoop);
    Vis.isRunning = false;
    Vis._stoptime = Date.now(); // record when animation paused
};

Vis.core = {
    frame: function() {

        Vis.t = (Date.now() - Vis._then) / 250; // time since start in seconds
        Vis.timeDisplay.textContent = Number((Vis.t/4).toFixed(1));  // different timescale for display to make visual effects more prominent
        Vis.core.update();
        Vis.core.animate();

        Vis.animationFrameLoop = window.requestAnimationFrame(Vis.core.frame);
    },

    update: function() {
        Vis.workers.calcPos();
    },

    animate: function() {
        Vis.context.clearRect(0, 0, Vis.canvasx, Vis.canvasy);
        Vis.context.fillStyle = 'orange';

        for (let i=0; i < Vis.N; i++) {
            Vis.context.beginPath();
            Vis.context.arc(Vis.convertCanvasX(Vis.x[i]), Vis.convertCanvasY(Vis.y[i]), Vis.convertCanvasX(Vis.pointR[i]), 0, 2*Math.PI);
            Vis.context.fill();
        }
    },

    updateSliders: function() {

        Vis.lambdaRange.value = Vis.lambda;
        Vis.lambdaDisplay.textContent = Vis.lambda;

    },

};

Vis.workers = {

    calcPos: function() {
        /*
        Step 1: Compute laplacian of phi (nabla2Phi) using Finite Difference Method
        Step 2: Compute second time derivative of phi (phiTwoDots)
        Step 3: Update all phi values (old phi, current phi, current phi cubed, new phi)
        Step 4: Update display (displaying new phi)
        */

        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                //Step 1: Compute laplacian of phi (nabla2Phi) using Finite Difference Method
                //Periodic boundary condition
                var il, ir;     //left hand side of ith term and right hand side of ith term
                var jl, jr;     //left hand side of jth term and right hand side of jth term
                if (i==0) {
                    il=Vis.Nx-1;
                    ir=i+1;
                } else if (i==Vis.Nx-1) {
                    il=i-1;
                    ir=0;
                } else {
                    il=i-1;
                    ir=i+1;
                }
                if (j==0) {
                    jl=Vis.Ny-1;
                    jr=j+1;
                } else if (j==Vis.Ny-1) {
                    jl=j-1;
                    jr=0;
                } else {
                    jl=j-1;
                    jr=j+1;
                }
                var temporaryNabla2Phi = math.multiply(math.add(math.add(math.add(math.add(Vis.phiCurrentTime[il][j], Vis.phiCurrentTime[i][jl]), Vis.phiCurrentTime[ir][j]), Vis.phiCurrentTime[i][jr]), math.multiply(-4, Vis.phiCurrentTime[i][j])), Math.pow(Vis.a, -2));
                Vis.nabla2Phi[i][j] = temporaryNabla2Phi;
                //Step 2: Compute second time derivative of phi (phiTwoDots)
                //This is the equation of motion of the field
                var temporaryPhiTwoDots = math.add(temporaryNabla2Phi, math.add(math.multiply(-math.pow(Vis.m, 2), Vis.phiCurrentTime[i][j]), math.multiply(-Vis.lambda, Vis.phiCurrentTimeCubed[i][j])));
                Vis.phiTwoDots[i][j] = temporaryPhiTwoDots;
                //Step 3: Update all phi values (old phi, current phi, current phi cubed, new phi)
                Vis.phiOldTime[i][j] = Vis.phiCurrentTime[i][j]; 
                Vis.phiCurrentTime[i][j] = Vis.phiNewTime[i][j]; 
                Vis.phiCurrentTimeCubed[i][j] = math.pow(Vis.phiCurrentTime[i][j], 3);
                var temporaryPhiNewTime = math.add(math.add(math.multiply(2, Vis.phiCurrentTime[i][j]), math.multiply(-1, Vis.phiOldTime[i][j])), math.multiply(math.pow(Vis.timeStep, 2), temporaryPhiTwoDots));
                Vis.phiNewTime[i][j] = temporaryPhiNewTime;
                //Step 4: Update display using new phi
                var n = Vis.Ny * i + j;
                var phiSq = Math.pow(temporaryPhiNewTime.re, 2) + Math.pow(temporaryPhiNewTime.im, 2);
                Vis.pointR[n] = 0.2*phiSq + 0.05;
            }
        }

    },
};

Vis.setup = {
    initConsts: function() {
        Vis.a = 0.25; // point spacing

        Vis.Nx = Math.round(20/Vis.a); // # of points in x direction
        Vis.Ny = Math.round(20/Vis.a); // # of points in y direction
        Vis.N = Vis.Nx * Vis.Ny;

        Vis.canvasx = 450;
        Vis.canvasy = 450;

        Vis.x = new Array(Vis.N);
        Vis.y = new Array(Vis.N);

        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                var n = Vis.Ny * i + j;
                Vis.x[n] = i*Vis.a;
                Vis.y[n] = j*Vis.a;
            }
        } 

        Vis.timeStep = 1/100;
        Vis.timeDisplay = document.getElementById('time-display');

    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.xbar1 = 10;
        Vis.ybar1 = 10;
        Vis.pxbar1 = 1;
        Vis.pybar1 = 0;

        Vis.xbar2 = 1000000;
        Vis.ybar2 = 0;
        Vis.pxbar2 = 0;
        Vis.pybar2 = 0;

        Vis.sigma = 3;
        Vis.m = 10;

        Vis.lambda = 0;

        Vis.phiOldTime = [];
        Vis.phiCurrentTime = [];
        Vis.phiCurrentTimeCubed = [];
        Vis.phiNewTime = [];
        Vis.nabla2Phi = [];
        Vis.phiOneDot = [];
        Vis.phiTwoDots = [];

        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                Vis.phiOldTime.push(new Array(1));
                Vis.phiCurrentTime.push(new Array(1));
                Vis.phiCurrentTimeCubed.push(new Array(1));
                Vis.phiNewTime.push(new Array(1));
                Vis.nabla2Phi.push(new Array(1));    
                Vis.phiOneDot.push(new Array(1));            
                Vis.phiTwoDots.push(new Array(1));
            }
        }

        Vis.pointR = new Array(Vis.N);
    },

    initCondition: function() {
        /*
        Step 1: Retrieving initial positions and momenta from sliders and compute dispersion
        Step 2: Compute initial phi and first time derivative of phi
        Step 3: Compute laplacian of phi (nabla2Phi) using Finite Difference Method
        Step 4: Compute second time derivative of phi (phiTwoDots)
        Step 5: Compute new phi so that we have two sets of phi for further iteration
        Step 6: Update display using new phi
        */

        //Step 1: Retrieving initial positions and momenta from sliders and compute dispersion
        var x0vec1 = [Vis.xbar1, Vis.ybar1];
        var pvec1 = [Vis.pxbar1, Vis.pybar1];
        var psq1 = math.add(Math.pow(pvec1[0], 2), Math.pow(pvec1[1], 2));
        var E1 = Math.pow(math.add(psq1, Math.pow(Vis.m, 2)), 0.5);
        var Ep1 = 0.5*Math.pow(E1, -1);

        var x0vec2 = [Vis.xbar2, Vis.ybar2];
        var pvec2 = [Vis.pxbar2, Vis.pybar2];
        var psq2 = math.add(Math.pow(pvec2[0], 2), Math.pow(pvec2[1], 2));
        var E2 = Math.pow(math.add(psq2, Math.pow(Vis.m, 2)), 0.5);
        var Ep2 = 0.5*Math.pow(E2, -1);

        //Step 2: Compute initial phi and first time derivative of phi
        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {

                var xvec = [Vis.a*i, Vis.a*j];      // current position on the grid for calculation

                //Particle 1 represented by Gaussian
                var deltaxvec1 =  math.subtract(xvec, x0vec1);
                var deltaxvec1sq = Math.pow(deltaxvec1[0], 2) + Math.pow(deltaxvec1[1], 2);
                var r1 = math.exp(- Math.pow(Vis.sigma, 2)*deltaxvec1sq/2 );
                var theta1 = math.dot(pvec1, deltaxvec1);
                var phi1 = math.Complex.fromPolar(r1, theta1);

                var horrible1Re = 2*math.dot(pvec1, deltaxvec1)*Ep1*(psq1 - 2*Math.pow(Vis.sigma, 2)*deltaxvec1sq);
                var horrible1Im = -(E1-2*psq1*Ep1);
                var horrible1 = math.complex(horrible1Re, horrible1Im);
                var phi1OneDot = math.multiply(phi1, horrible1);

                //Particle 2 represented by another Gaussian
                var deltaxvec2 =  math.subtract(xvec, x0vec2);
                var deltaxvec2sq = Math.pow(deltaxvec2[0], 2) + Math.pow(deltaxvec2[1], 2);
                var r2 = math.exp(- Math.pow(Vis.sigma, 2)*deltaxvec2sq/2 );
                var theta2 = math.dot(pvec2, deltaxvec2);
                var phi2 = math.Complex.fromPolar(r2, theta2);

                var horrible2Re = 2*math.dot(pvec2, deltaxvec2)*Ep2*(psq2 - 2*Math.pow(Vis.sigma, 2)*deltaxvec2sq);
                var horrible2Im = -(E2-2*psq2*Ep2);
                var horrible2 = math.complex(horrible2Re, horrible2Im);
                var phi2OneDot = math.multiply(phi2, horrible2);

                Vis.phiCurrentTime[i][j] = math.add(phi1, phi2);
                Vis.phiCurrentTimeCubed[i][j] = math.Complex.fromPolar(Math.pow(r1+r2, 3), 3*(theta1+theta2));
                Vis.phiOneDot[i][j] = math.add(phi1OneDot, phi2OneDot);
            }
        }

        //Step 3: Compute laplacian of phi (nabla2Phi) using Finite Difference Method
        //This is done in a separate for loop because we need a complete grid of phi to use Finite Difference
        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                //Step 1: Compute laplacian of phi (nabla2Phi) using Finite Difference Method
                //Periodic boundary condition
                var il, ir;     //left hand side of ith term and right hand side of ith term
                var jl, jr;     //left hand side of jth term and right hand side of jth term
                if (i==0) {
                    il=Vis.Nx-1;
                    ir=i+1;
                } else if (i==Vis.Nx-1) {
                    il=i-1;
                    ir=0;
                } else {
                    il=i-1;
                    ir=i+1;
                }
                if (j==0) {
                    jl=Vis.Ny-1;
                    jr=j+1;
                } else if (j==Vis.Ny-1) {
                    jl=j-1;
                    jr=0;
                } else {
                    jl=j-1;
                    jr=j+1;
                }
                var temporaryNabla2Phi = math.multiply(math.add(math.add(math.add(math.add(Vis.phiCurrentTime[il][j], Vis.phiCurrentTime[i][jl]), Vis.phiCurrentTime[ir][j]), Vis.phiCurrentTime[i][jr]), math.multiply(-4, Vis.phiCurrentTime[i][j])), Math.pow(Vis.a, -2));
                Vis.nabla2Phi[i][j] = temporaryNabla2Phi;
                //Step 4: Compute second time derivative of phi (phiTwoDots)
                var temporaryPhiCurrentTime = Vis.phiCurrentTime[i][j];
                //This is the equation of motion of the field
                var temporaryPhiTwoDots = math.add(temporaryNabla2Phi, math.add(math.multiply(-math.pow(Vis.m, 2), temporaryPhiCurrentTime), math.multiply(-Vis.lambda, Vis.phiCurrentTimeCubed[i][j])));
                Vis.phiTwoDots[i][j] = temporaryPhiTwoDots;
                //Step 5: Compute new phi so that we have two sets of phi for further iteration
                Vis.phiCurrentTimeCubed[i][j] = math.pow(temporaryPhiCurrentTime, 3);
                var temporaryPhiNewTime = math.add(math.add(temporaryPhiCurrentTime, math.multiply(Vis.timeStep, Vis.phiOneDot[i][j])), math.multiply(math.pow(Vis.timeStep, 2), temporaryPhiTwoDots));
                Vis.phiNewTime[i][j] = temporaryPhiNewTime;
                //Step 6: Update display using new phi
                var n = Vis.Ny * i + j;
                var phiSq = Math.pow(temporaryPhiNewTime.re, 2) + Math.pow(temporaryPhiNewTime.im, 2);
                Vis.pointR[n] = 0.2*phiSq + 0.05;
            }
        }


    },

    initGraph: function() {
        Vis.canvas = d3.select('#canvas-div')
                       .append('canvas')
                        .attr('width', Vis.canvasx)
                        .attr('height', Vis.canvasy);
        Vis.context = Vis.canvas.node().getContext('2d');

        Vis.convertCanvasX = d3.scaleLinear()
                                .domain([0, Vis.Nx*Vis.a])
                                .range([0, Vis.canvasx]);
        Vis.convertCanvasY = d3.scaleLinear()
                                .domain([0, Vis.Ny*Vis.a])
                                .range([Vis.canvasy, 0]);
    },

    initButton: function() {
        //Vis.buttonPlay = document.getElementById('buttonPlay');
        Vis.buttonRestart = document.getElementById('buttonRestart');

        //Vis.buttonPlay.addEventListener('click', function() {
        //    if (Vis.isRunning) {
        //        Vis.stop();
        //        document.getElementById('buttonPlay').innerHTML = 'Play';
        //    } else {
        //        Vis.start();
        //        document.getElementById('buttonPlay').innerHTML = 'Stop';
        //    }
        //});

        Vis.buttonRestart.addEventListener('click', function() {
            Vis.setup.initCondition();  //Reset the initial condition
            Vis._then = Date.now();     //Reset the time to t = 0
        });
    },

    initSlider: function() {

        Vis.lambdaRange = document.getElementById('lambda-range');
        Vis.lambdaDisplay = document.getElementById('lambda-display');

        Vis.lambdaRange.addEventListener('input', function() {
            Vis.lambda = Vis.lambdaRange.value;
            Vis.lambdaDisplay.textContent = Vis.lambda;
        });

        Vis.core.updateSliders();
    },
};


//---------------------------------//
// Interactive Arrow Object        //
//---------------------------------//

window.Arrow = window.Arrow || {};

Arrow.init = function() {
    Arrow.setup.initConst();
    Arrow.setup.initPositionsArrows();
    Arrow.setup.initMomentaArrows();
    Arrow.setup.initDrag();
};

Arrow.helpers = {
    updateArrow: function(arrow, type) {
        var tipx, tipy, dp;
        if (type == 'p') {
            tipx = (arrow.x + 1)*Arrow.width/2;
            tipy = (1 - arrow.y)*Arrow.height/2;
            dp = 2;
        } else if (type == 'x') {
            tipx = arrow.x*Arrow.width/20;
            tipy = (1 - arrow.y/20)*Arrow.height;
            dp = 1;
        }

        arrow.body.attr('x2', tipx)
                  .attr('y2', tipy);
        arrow.tip.attr('cx', tipx)
                 .attr('cy', tipy);

        if (tipy > 22) {
            if (tipx < 85) {
                arrow.text.attr('x', tipx + 10)
                .attr('y', tipy - 7.5)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(dp) + ', ' + Number(arrow.y).toFixed(dp) + ')');
            } else if (tipx < 100) {
                arrow.text.attr('x', tipx + 10 - 80)
                .attr('y', tipy - 7.5)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(dp) + ', ' + Number(arrow.y).toFixed(dp) + ')');
            } else {
                arrow.text.attr('x', tipx + 10 - 105)
                .attr('y', tipy - 7.5)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(dp) + ', ' + Number(arrow.y).toFixed(dp) + ')');
            }   
        } else {
            if (tipx < 85) {
                arrow.text.attr('x', tipx)
                .attr('y', tipy + 15)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(dp) + ', ' + Number(arrow.y).toFixed(dp) + ')');
            } else if (tipx < 100) {
                arrow.text.attr('x', tipx - 90)
                .attr('y', tipy + 15)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(dp) + ', ' + Number(arrow.y).toFixed(dp) + ')');
            } else {
                arrow.text.attr('x', tipx - 110)
                .attr('y', tipy + 15)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(dp) + ', ' + Number(arrow.y).toFixed(dp) + ')');
            }   
        }


    },

    convertCoords: function(sx, sy, type) {
        if (type == 'p') {
            x = 2*sx/Arrow.width - 1;
            y = 1 - 2*sy/Arrow.height;
            if (x > 1) {
                x = 1;
            } else if (x < -1){
                x = -1;
            }
            if (y > 1) {
                y = 1;
            } else if (y < -1) {
                y = -1;
            }
        } else if (type == 'x') {
            x = 20*sx/Arrow.width;
            y = 20*(1 - sy/Arrow.height);
            if (x > 20) {
                x = 20;
            } else if (x < 0){
                x = 0;
            }
            if (y > 20) {
                y = 20;
            } else if (y < 0) {
                y = 0;
            }
        }
        return [x, y];
    },

    updateAPP: function() {
        Vis.xbar1 = Arrow.xArrow1.x;
        Vis.ybar1 = Arrow.xArrow1.y;

        Vis.xbar2 = Arrow.xArrow2.x;
        Vis.ybar2 = Arrow.xArrow2.y;

        Vis.pxbar1 = Arrow.pArrow1.x;
        Vis.pybar1 = Arrow.pArrow1.y;

        Vis.pxbar2 = Arrow.pArrow2.x;
        Vis.pybar2 = Arrow.pArrow2.y;
    }
};

Arrow.setup = {
    initConst: function() {
        Arrow.width = window.innerHeight*0.35;
        Arrow.height = window.innerHeight*0.35;

        Arrow.strokeWidth = 2;
        Arrow.tipRadius = 5;
    },

    initPositionsArrows: function() {
        Arrow.svg = d3.select('#positions-arrow');
        Arrow.svg.attr('width', Arrow.width)
                 .attr('height', Arrow.height)
                 .attr('style', 'border: 10px grey');

        Arrow.xArrow1 = {
            x: Vis.xbar1,
            y: Vis.ybar1,
            stext: 'x1'
        };

        Arrow.xArrow2 = {
            x: Vis.xbar2,
            y: Vis.ybar2,
            stext: 'x2'
        };

        Arrow.setup.initArrow(Arrow.xArrow1, 'x');
        Arrow.setup.initArrow(Arrow.xArrow2, 'x');
    },

    initMomentaArrows: function() {
        Arrow.svg = d3.select('#momenta-arrow');
        Arrow.svg.attr('width', Arrow.width)
                 .attr('height', Arrow.height)
                 .attr('style', 'border: 10px grey');

        Arrow.pArrow1 = {
            x: Vis.pxbar1,
            y: Vis.pybar1,
            stext: 'p1'
        };

        Arrow.pArrow2 = {
            x: Vis.pxbar2,
            y: Vis.pybar2,
            stext: 'p2'
        };

        Arrow.setup.initArrow(Arrow.pArrow1, 'p');
        Arrow.setup.initArrow(Arrow.pArrow2, 'p');
    },

    initDrag: function() {
        function dragged(arrow, type) {
            return function() {
                var xy = Arrow.helpers.convertCoords(d3.event.x, d3.event.y, type);
                arrow.x = xy[0];
                arrow.y = xy[1];
                Arrow.helpers.updateArrow(arrow, type);
                Arrow.helpers.updateAPP(); // sync arrow values with main vis
            };
        }
        Arrow.xArrow1.tip.call(d3.drag().on('drag', dragged(Arrow.xArrow1, 'x')));
        Arrow.xArrow2.tip.call(d3.drag().on('drag', dragged(Arrow.xArrow2, 'x')));
        Arrow.pArrow1.tip.call(d3.drag().on('drag', dragged(Arrow.pArrow1, 'p')));
        Arrow.pArrow2.tip.call(d3.drag().on('drag', dragged(Arrow.pArrow2, 'p')));
    },

    initArrow: function(arrow, type) {
        arrow.container = Arrow.setup.createArrowContainer();
        arrow.body = Arrow.setup.createArrowBody(arrow, type);
        arrow.tip = Arrow.setup.createArrowTip(arrow);
        arrow.text = Arrow.setup.createArrowText(arrow);

        Arrow.helpers.updateArrow(arrow, type);
    },

    createArrowContainer: function() {
        return Arrow.svg.append('svg')
                        .attr('width', Arrow.width)
                        .attr('height', Arrow.height);
    },

    createArrowBody: function(arrow, type) {
        if (type == 'x') {
            return arrow.container.append('line')
            .attr('x1', 0).attr('y1', Arrow.width)
            .attr('stroke-width', Arrow.strokeWidth)
            .attr('stroke', 'black');
        } else if (type == 'p') {
            return arrow.container.append('line')
            .attr('x1', Arrow.width/2).attr('y1', Arrow.width/2)
            .attr('stroke-width', Arrow.strokeWidth)
            .attr('stroke', 'black');
        }
    },

    createArrowTip: function(arrow) {
        return arrow.container.append('circle')
                              .attr('r', Arrow.tipRadius);
    },

    createArrowText: function(arrow) {
        return arrow.container.append('text');
    }
};

document.addEventListener('DOMContentLoaded', Vis.init);