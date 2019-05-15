var CROSSOVER_RATE = 0.7;
var MUTATION_RATE = 0.05;
var MAX_GENERATIONS = 100;
var MAX_POPULATION = 20;
var ELITISM = 5;

var REQUIREMENTS = [
	{ cost: 60, risk: 3, value: (10*3 + 10*4 + 5*2) / 3 },
	{ cost: 40, risk: 6, value: (10*3 + 10*4 + 6*2) / 3 },
	{ cost: 40, risk: 2, value: (4*3 + 4*4 + 8*2) / 3 },
	{ cost: 30, risk: 6, value: (9*3 + 9*4 + 1*2) / 3 },
	{ cost: 20, risk: 4, value: (7*3 + 7*4 + 5*2) / 3 },
	{ cost: 20, risk: 8, value: (6*3 + 6*4 + 2*2) / 3 },
	{ cost: 25, risk: 9, value: (6*3 + 6*4 + 4*2) / 3 },
	{ cost: 70, risk: 7, value: (8*3 + 8*4 + 3*2) / 3 },
	{ cost: 50, risk: 6, value: (7*3 + 7*4 + 5*2) / 3 },
	{ cost: 20, risk: 6, value: (10*3 + 10*4 + 7*2) / 3 },
];

var RELEASES = [125, 125, 125];

function start() {

	var generations = [];
	var log = [];
	var population = randomPopulation();

	for (var i = 0; i < MAX_GENERATIONS; i++) {

		crossoverRoutine(population, function(children) {

			// Adicionar filhos na população
			population = population.concat(children);

			mutationRoutine(population, function(mutants) {

				// Substituir população pelos "mutantes" (nem todos os indivíduos sofreram mutação)
				population = mutants;

				filterRoutine(population, function(slice) {

					// Continuar apenas com determinada parcela da população
					population = slice;

					population.sort(function(a, b) {
						return a.score > b.score ? -1 : 1;
					});

					var values = array_column(population, "score");

					log.push({
						avg: array_avg(values),
						max: Math.max(...values),
						best: JSON.stringify(population[0].chromosome),
					});

					generations.push(population.slice(0));

				});

			});

		});
	}

	showResults(log);

}

function randomPopulation() {

	var population = [];
	while (population.length < MAX_POPULATION) {

		var chromosome = fixChromossome(getRandomChromosome());

		population.push({
			chromosome: chromosome,
			score: getChromosomeScore(chromosome)
		});
	}

	return population;
}

function getRandomChromosome() {

	var genes = [];
	while (genes.length < REQUIREMENTS.length) {
		genes.push(randomInt(0, RELEASES.length));
	}

	return genes;
}

function getChromosomeFixKey(chromosome) {

	var costs = [];
	var indexes = [];

	chromosome.forEach(function(gene, index) {

		var req = REQUIREMENTS[index];
		if (gene > 0) {

			if (costs[gene] === undefined) costs[gene] = 0;
			costs[gene] += req.cost;

			if (indexes[gene] === undefined) indexes[gene] = [];
			indexes[gene].push(index);

		}
		
	});

	
	var fix = false;
	costs.forEach(function(value, i) {
		
		var rel = RELEASES[i - 1];
		var diff = rel - value;
		
		if (fix == false && diff < 0 && indexes[i] && indexes[i].length > 0) {
			fix = indexes[i][0];
		}
		
	});
	
	return fix;
}

function isChromossomeValid(chromosome) {
	return getChromosomeFixKey(chromosome) === false;
}

function fixChromossome(chromosome) {

	var key = getChromosomeFixKey(chromosome);

	if (key !== false) {
		chromosome[key] = 0; return fixChromossome(chromosome);
	
	} else {
		return chromosome;
	}
}

function getChromosomeScore(chromosome) {

	var score = 0;
	chromosome.forEach(function(gene, index) {

		var req = REQUIREMENTS[index];

		var a = req.cost * req.value;
		var b = RELEASES.length - gene + 1;
		var c = req.risk * gene;
		
		if (gene == 0) {
			score = score - a;
		} else {
			score = score + ((a * b) - c);
		}

	});

	return score;
}

function crossoverRoutine(population, callback) {

	var pop = clone(population);
	var couples = [];
	var couple = [];
	var arr = [];
	var children = [];

	while (pop.length > 0) {

		var k = roulette(pop, "score");
		if (k !== false) {

			couple.push(pop[k]);
	
			if (couple.length == 2) {
				couples.push(couple);
				couple = [];
			}
	
			pop.splice(k, 1);
		
		} else {
			break;
		}
	}

	couples.forEach(function(couple) {

		if (couple.length == 2 && roll(CROSSOVER_RATE)) {
			arr = arr.concat(crossover(couple[0].chromosome, couple[1].chromosome ));
		}

	});

	arr.forEach(function(c, i) {

		var chromosome = fixChromossome(c);
		children.push({
			chromosome: chromosome,
			score: getChromosomeScore(chromosome)
		});

	});

	callback(children);

}

function crossover(a, b) {

	var split = randomInt(1, a.length - 1);

	var c1 = [];
	var c2 = [];

	for (var i = 0; i < a.length; i++) {

		if (i < split) {
			c1.push(a[i]); c2.push(b[i]);

		} else {
			c1.push(b[i]); c2.push(a[i]);
		}
	}
	
	return [c1, c2];
}

function mutationRoutine(population, callback) {

	var pop = clone(population);
	pop.forEach(function(row, index) {

		var chromosome = row.chromosome;
		var updates = [];
		
		chromosome.forEach(function(gene, index) {

			if (roll(MUTATION_RATE)) {

				var newGene = gene;
				while (newGene == gene) {
					newGene = randomInt(0, RELEASES.length);
				}

				updates.push({ index: index, gene: newGene });

			}
			
		});

		var updatedChromossome = false;

		if (updates.length > 0) {

			var tmp1 = [];
			for (var i = 1; i <= updates.length; i++) {
	
				var tmp2 = [];
				for (var j = 0; j < i; j++) {
					tmp2.push(updates[j]);
				}
	
				tmp1.push(tmp2);
			}
	
			// Gerar todas as mutações possíveis
			var mutations = [];
			tmp1.forEach(function(arr) {
	
				var copy = clone(chromosome);
				arr.forEach(function(row) {
					copy[row.index] = row.gene;
				});
	
				mutations.push(copy);
	
			});

			mutations.forEach(function(c) {
				if (isChromossomeValid(c)) updatedChromossome = c;
			});

		}

		if (updatedChromossome) {
			
			pop[index] = {
				chromosome: updatedChromossome,
				score: getChromosomeScore(updatedChromossome)
			}
		}

	});

	callback(pop);
}

function filterRoutine(population, callback) {

	var copy = clone(population);

	copy.sort(function(a, b) {
		return a.score < b.score ? 1 : -1;
	});
	
	var keep = [];

	if (ELITISM) {
		keep = copy.splice(0, ELITISM);
	}

	while (keep.length < MAX_POPULATION) {
		var k = roulette(copy, "score");
		keep.push(copy[k]);
		copy.splice(k, 1);
	}

	callback(keep);
}

start();

// -----------------------------------------------------------------------------

function showResults(log) {

	var answer = JSON.parse(log[log.length - 1].best);
	var reqs = [];

	answer.forEach(function(value, index) {

		var req = REQUIREMENTS[index];
		reqs.push({
			release: value,
			req: index,
			cost: req.cost,
			risk: req.risk,
			value: req.value,
		});

	});

	console.table(REQUIREMENTS);
	console.table(log);

	var $best = $(".best");
	$best.html("");

	answer.forEach(function(value) {
		$best.append(`<li><span>${ value }</span></li>`);
	});

	var bestScore = Math.round(getChromosomeScore(answer));
	$best.after(`<span class="best-score">${ bestScore }</span>`)

	var avgColumn = array_column(log, "avg");
	var maxColumn = array_column(log, "max");

	var labels = [];
	for (var i = 1; i <= log.length; i++) {
		labels.push(i);
	}

	var datasetsOptions = {
		fill: false, lineTension: 0, pointRadius: 1, borderWidth: 1
	};

	var lineChartData = {
		labels: labels,
		datasets: [
			Object.assign({ label: "avg", data: avgColumn, borderColor: "blue" }, datasetsOptions),
			Object.assign({ label: "max", data: maxColumn, borderColor: "red" }, datasetsOptions)
		]
	}

	var ctx = document.getElementById("chart").getContext("2d");
	Chart.Line(ctx, {
		data: lineChartData,
	});

}