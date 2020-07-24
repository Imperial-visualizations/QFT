//---------------------------------//
// Visualisation Object            //
//---------------------------------//

window.Vis = window.Vis || {};

Vis.init = function() {
    Vis.isRunning = false;

    Vis.setup.initConsts();
    Vis.setup.initVars();

    Arrow.init(); // init arrows

    Vis.setup.initGraph();
    Vis.setup.initButton();

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

};

Vis.workers = {

    calcPos: function() {

        var x0vec1 = [Vis.xbar1, Vis.ybar1];
        var x0sq1 = (Math.pow(Vis.xbar1, 2) + Math.pow(Vis.ybar1, 2));
        var Vgt1 = [Vis.pxbar1*Vis.t/Vis.m, Vis.pybar1*Vis.t/Vis.m];
        var Vgtsq1 = (Math.pow(Vis.pxbar1*Vis.t/Vis.m, 2) + Math.pow(Vis.pybar1*Vis.t/Vis.m, 2));

        var x0vec2 = [Vis.xbar2, Vis.ybar2];
        var x0sq2 = (Math.pow(Vis.xbar2, 2) + Math.pow(Vis.ybar2, 2));
        var Vgt2 = [Vis.pxbar2*Vis.t/Vis.m, Vis.pybar2*Vis.t/Vis.m];
        var Vgtsq2 = (Math.pow(Vis.pxbar2*Vis.t/Vis.m, 2) + Math.pow(Vis.pybar2*Vis.t/Vis.m, 2));

        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                var n = Vis.Ny * i + j;
                var xvec = [Vis.a*i, Vis.a*j];
                var xsq = (Math.pow(Vis.a*i, 2) + Math.pow(Vis.a*j, 2));
                phiSq = Math.exp(-Math.pow(Vis.sigma, 2)*Math.abs(xsq + x0sq1 + Vgtsq1 + 2*(math.dot(x0vec1, Vgt1) - math.dot(xvec, Vgt1) - math.dot(xvec, x0vec1))));
                phiSq += Math.exp(-Math.pow(Vis.sigma, 2)*Math.abs(xsq + x0sq2 + Vgtsq2 + 2*(math.dot(x0vec2, Vgt2) - math.dot(xvec, Vgt2) - math.dot(xvec, x0vec2))));
                Vis.pointR[n] = 0.2*phiSq + 0.05;
            }
        }
    },
};

Vis.setup = {
    initConsts: function() {
        Vis.a = 0.5; // point spacing

        Vis.Nx = 40; // # of points in x direction
        Vis.Ny = 40; // # of points in y direction
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

        Vis.timeDisplay = document.getElementById('time-display');

    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.xbar1 = 0;
        Vis.ybar1 = 0;
        Vis.pxbar1 = 0.25;
        Vis.pybar1 = 0.25;

        Vis.xbar2 = 20;
        Vis.ybar2 = 0;
        Vis.pxbar2 = -0.25;
        Vis.pybar2 = 0.25;

        Vis.sigma = 0.5;
        Vis.m = 0.5;

        Vis.pointR = new Array(Vis.N);
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
            Vis._then = Date.now();
        });
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