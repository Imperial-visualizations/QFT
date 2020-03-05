//---------------------------------//
// Visualisation Object            //
//---------------------------------//

window.Vis = window.Vis || {};

Vis.init = function() {
    Vis.isRunning = false;

    Vis.setup.initConsts();
    Vis.setup.initVars();

    Vis.setup.initGraph();
    Vis.setup.initButton();
    Vis.setup.initSlider();

    Vis.start();
    //Vis.stop();
};

Vis.start = function() {
    if (Vis._stoptime) {
        Vis._then += Date.now() - Vis._stoptime; // add stopped time
    };

    if (!Vis.isRunning) {
        Vis.core.frame();
        Vis.isRunning = true;
    };
};

Vis.stop = function() {
    window.cancelAnimationFrame(Vis.animationFrameLoop);
    Vis.isRunning = false;
    Vis._stoptime = Date.now(); // record when animation paused
}

Vis.core = {
    frame: function() {

        Vis.t = (Date.now() - Vis._then) / 250; // time since start in seconds

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
            Vis.context.arc(Vis.convertCanvasX(Vis.x[i]), Vis.convertCanvasY(Vis.y[i])
                                , Vis.convertCanvasX(Vis.pointR[i]), 0, 2*Math.PI);
            Vis.context.fill();
        }
    },

    updateSliders: function() {

        Vis.xbarRange.value = Vis.xbar;
        Vis.xbarDisplay.textContent = Vis.xbar;

        Vis.ybarRange.value = Vis.ybar;
        Vis.ybarDisplay.textContent = Vis.ybar;

        Vis.pxbarRange.value = Vis.pxbar;
        Vis.pxbarDisplay.textContent = Vis.pxbar;

        Vis.pybarRange.value = Vis.pybar;
        Vis.pybarDisplay.textContent = Vis.pybar;

        Vis.sigmaRange.value = Vis.sigma;
        Vis.sigmaDisplay.textContent = Vis.sigma;

        Vis.massRange.value = Vis.m;
        Vis.massDisplay.textContent = Vis.m;

    },

}

Vis.workers = {

    calcPos: function() {

        var x0vec = [Vis.xbar, Vis.ybar];
        var x0sq = (Math.pow(Vis.xbar, 2) + Math.pow(Vis.ybar, 2));
        var Vgt = [Vis.pxbar*Vis.t/Vis.m, Vis.pybar*Vis.t/Vis.m];
        var Vgtsq = (Math.pow(Vis.pxbar*Vis.t/Vis.m, 2) + Math.pow(Vis.pybar*Vis.t/Vis.m, 2));

        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                var n = Vis.Ny * i + j;
                var xvec = [Vis.a*i, Vis.a*j];
                var xsq = (Math.pow(Vis.a*i, 2) + Math.pow(Vis.a*j, 2));
                phiSq = Math.exp(-Math.pow(Vis.sigma, 2)*Math.abs(xsq + x0sq + Vgtsq + 2*(math.dot(x0vec, Vgt) - math.dot(xvec, Vgt) - math.dot(xvec, x0vec))));
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

    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.xbar = 5;
        Vis.ybar = 5;
        Vis.pxbar = 0.5;
        Vis.pybar = 0.5;
        Vis.sigma = 0.5;
        Vis.m = 1;

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

    initSlider: function() {

        Vis.xbarRange = document.getElementById('xbar-range');
        Vis.xbarDisplay = document.getElementById('xbar-display');

        Vis.xbarRange.addEventListener('input', function() {
            Vis.xbar = Vis.xbarRange.value;
            Vis.xbarDisplay.textContent = Vis.xbar;
        });

        Vis.ybarRange = document.getElementById('ybar-range');
        Vis.ybarDisplay = document.getElementById('ybar-display');

        Vis.ybarRange.addEventListener('input', function() {
            Vis.ybar = Vis.ybarRange.value;
            Vis.ybarDisplay.textContent = Vis.ybar;
        });

        Vis.pxbarRange = document.getElementById('pxbar-range');
        Vis.pxbarDisplay = document.getElementById('pxbar-display');

        Vis.pxbarRange.addEventListener('input', function() {
            Vis.pxbar = Vis.pxbarRange.value;
            Vis.pxbarDisplay.textContent = Vis.pxbar;
        });

        Vis.pybarRange = document.getElementById('pybar-range');
        Vis.pybarDisplay = document.getElementById('pybar-display');

        Vis.pybarRange.addEventListener('input', function() {
            Vis.pybar = Vis.pybarRange.value;
            Vis.pybarDisplay.textContent = Vis.pybar;
        });

        Vis.sigmaRange = document.getElementById('sigma-range');
        Vis.sigmaDisplay = document.getElementById('sigma-display');

        Vis.sigmaRange.addEventListener('input', function() {
            Vis.sigma = Vis.sigmaRange.value;
            Vis.sigmaDisplay.textContent = Vis.sigma;
        });

        Vis.massRange = document.getElementById('mass-range');
        Vis.massDisplay = document.getElementById('mass-display');

        Vis.massRange.addEventListener('input', function() {
            Vis.m = Vis.massRange.value;
            Vis.massDisplay.textContent = Vis.m;
        });

        Vis.core.updateSliders();
    },
};

document.addEventListener('DOMContentLoaded', Vis.init);