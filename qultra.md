# Using QuLTRA

[QuLTRA](https://github.com/SimonaZaccaria/QuLTRA) performs energy-participation-ratio quantisation of superconducting circuits with **lumped and distributed elements together**.
It accepts coplanar-waveguide sections and returns mode frequencies, linewidths, participation ratios, and the Kerr matrix.

**Read the four checks below before using results.**
The first covers three separate ways the mode finder loses a mode -- two modes closer together than one scan step, a high node count, and a single mode too broad for a sign change to survive -- and any one of them changes the normalisation of every participation ratio and so every Kerr, including for the modes it found.
The remaining sections cover distributed energy, dielectric assumptions, and search windows.

> **Scope.**
> These observations came from circuits with a transmon, a tapped quarter-wave line, and lumped nodes.
> The measurements describe those tests; retain the checks when applying the package to another circuit.

---

## 1. The default scan step silently misses modes, and one missed mode poisons everything

`find_zeros.zero_algo` locates modes by scanning for sign changes of the characteristic polynomial in steps of a module-level constant, `qultra.constants.step`, whose default is **0.1 GHz**.
Two modes closer together than one step both fall inside a single interval, the sign does not change across it, and **both are missed with nothing raised**.
The mode list simply comes back short.

`total_inductive_energy` sums over the supplied modes.
An incomplete list changes the normalisation of every participation ratio and therefore the derived Kerrs, including those for modes the scan found.

Measured on a four-mode circuit whose two highest modes sat **25 MHz** apart:

| `qultra.constants.step` | modes found (there are four) |
|---|---|
| 0.1 GHz (default) | **2** |
| 0.05 GHz | **2** |
| 0.02 GHz | 4 |
| 0.01 GHz | 4 |

**Set the step before importing code that builds a circuit.**
It is read at solve time:

```python
import qultra.constants as KQ
KQ.step = 0.01                     # 0.01 GHz; the default 0.1 misses modes 25 MHz apart
import my_circuit_module           # only now
```

**And assert on the count.**
The step is a heuristic, not a guarantee, so a wrapper that knows how many modes the circuit has should say so:

```python
modes = solve(netlist)
if len(modes) < 4:
    raise RuntimeError("expected 4 modes, got %s GHz"
                       % [round(f / 1e9, 4) for f in modes])
```

### The same failure also arrives from the NODE COUNT, with no step that fixes it

Mode loss also occurred as node count increased, even for well-separated modes.
The same four-mode circuit was tested with its line replaced by two `N`-section L-C ladders:

| ladder sections per segment | nodes | modes found (there are four) | time |
|---|---|---|---|
| 16 | 33 | 4 | 4.5 s |
| 32 | 65 | **2** | 28 s |
| 48 | 97 | **2** | 169 s |

The surviving pair was 327 MHz apart near 24 GHz; modes at 3.1 and 6 GHz disappeared.
Halving `step` to 0.005 GHz did not recover them.
Test the practical node-count limit for each circuit and assert the mode count; finer scanning alone does not catch this failure.

### And a third: a single well-separated mode is lost for being BROAD

The two failures above are about how many modes there are and how many nodes carry them.
This one is about one mode's own linewidth, and it bounds what a design solve can reach rather than what a single solve can see.

Measured while sweeping the out-coupling capacitor of a four-mode circuit, holding the other six element values fixed so the coupled mode was free to broaden.
The mode that disappears is the **broad** one, not a member of the close pair:

| out-coupling capacitor | that mode's `kappa/2pi` | its Q | modes found (there are four) |
|---|---|---|---|
| 37.4 fF | 81.3 MHz | 74 | 4 |
| 40 fF | 90.4 MHz | 66 | 4 |
| 42 fF | 97.4 MHz | 58 | 4 |
| 44 fF | — | — | **3** |
| 46 fF | — | — | **3** |
| 50 fF | — | — | **3** |

So the edge sits where that mode's quality factor falls to about **58**, and the mode is still there: a harmonic-balance solver on the same circuit, locating modes from the driven response rather than by scanning a characteristic polynomial, finds it at every capacitance past the edge with its width rising smoothly to 127 MHz, and agrees with this package to 0.02% in width and 3e-5 in frequency wherever both find it.
**A root-finder that scans for sign changes can lose a pole whose imaginary part is large**, and no step size recovers it, because the sign change it is looking for has been smeared out rather than stepped over.

**What this costs is the design solve, and that is the reason to know about it.**
A single solve that loses a mode raises, and a wrapper asserting the count catches it.
A Newton solve that calls the mode finder inside its Jacobian cannot proceed at all: it fails at whatever target first drives the mode past the edge, and the failure looks like the *circuit* running out of room.
It is not.
Report such a ceiling as a limit on the solve, bracketed between the last target that converged and the first that did not, and check it against a second construction before calling it a property of the device.

## 2. `CPW.inductive_energy` is marked unverified in its own source, and it is correct

`CPW.inductive_energy` carries the comment `da verificare se e giusto !!!!!`.
A wrong prefactor would alter participation ratios and Kerrs without changing frequencies or linewidths, so the linear solve alone cannot validate it.

**It is verified and it is right — take numbers out of it.**
Its prefactor `Z0/(2v)` is exactly `L'/2` for a line whose inductance per unit length is `L' = Z0/v`, so what it evaluates is the textbook `(1/2) L' ∫|I|²dx`, and its `CPW.current` reconstructs both travelling-wave amplitudes correctly from the two end voltages.
Four independent checks agree, the tightest to 5.3 × 10⁻¹⁵: a closed form for the same integral, the analytic energy of a shorted line across electrical lengths from 0.05π to 1.5π, the lumped limit as the length goes to zero, and an `N`-section L-C ladder put in place of the line so that the same circuit is quantised with the distributed term present and then absent.

**Check mode completeness (§1) before suspecting this energy term.**

## 3. `epsilon_eff = (1 + epsilon_r)/2` is the package's own idealisation

The phase velocity used for a CPW comes from `qultra.constants.epsilon_r` through `epsilon_eff = (1 + epsilon_r)/2`, the standard thin-film half-space estimate.
On silicon that is `epsilon_eff = 6.45` and `v = 1.18043 × 10⁸ m/s`.

The model omits finite conductor width, gap, metal thickness, and substrate depth.
**Its line lengths describe that idealised medium.**
Validate them with a cross-section calculation before using them as fabrication dimensions.

## 4. A mode leaving its search window surfaces as an error from inside the Jacobian

`QuLTRA` raises `No zeros found in the specified interval` when `(fmin, fmax)` contains no mode.
During a Newton solve, bisection, or sweep, check which parameter moved the mode outside its window.

The cause is nearly always a **fixed** window over a swept parameter.
Two measured cases: over a search on a shunt capacitance, that node's own resonance ran from 153 GHz down to 1.5, and over a search on a line length the line's resonance left any window pinned near its design value.

**Scale windows and brackets to the current target.**
If a full Newton step enters a region with no mode, halve the step and retry.

---

## What it publishes, and what that is good for

`run_epr` returns participation ratios **directly**, alongside frequencies, linewidths, and the Kerr matrix.

Every Kerr is a function of the mode frequencies and `p` alone,

    alpha_i  = -f_i^2 p_i^2   / (8 EJ),
    chi_ij   = -f_i f_j p_i p_j / (4 EJ),

so compare the participation inputs as well as derived Kerrs.
In one three-way comparison against two other quantisations of the same lumped circuit, participations agreed to 7.4 × 10⁻⁵ and the worst deviation on any quantity was 1.6 × 10⁻⁴.

It also takes the junction's linear inductance and **derives `EJ` from it** rather than accepting both.
That is the right way round: a tool given both can end up describing two different junctions, and the signature when it happens is every Kerr off by one constant factor while every frequency and linewidth is right.

## Sign convention

Kerrs come back **positive**, with the sign carried in the Hamiltonian.
Anharmonicities and dispersive shifts are negative for a transmon, so a table written signed has to negate them, and one written unsigned has to say so.
