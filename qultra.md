# QuLTRA validation notes

[QuLTRA](https://github.com/SimonaZaccaria/QuLTRA) models superconducting circuits with lumped elements and transmission lines. Pin the package version or commit for reproducible work. Treat numerical settings and implementation details as version-dependent; validate them on the circuit being studied.

## Check mode completeness and convergence

A root search can miss closely spaced modes when its sampling interval is too coarse. Converge both the search step and frequency range; do not assume a successful solve found every relevant mode. Where available, compare against an analytic limit or an independent solver.

Versions using `qultra.constants.step` expose a scan-step setting. Check its units and where it is read in the installed source before changing it, and configure it before constructing or solving circuits. Choose the value through convergence checks rather than copying a fixed value from another study.

Check the expected mode count within a specified frequency window when it is known. Track mode identity through sweeps, especially near crossings. For distributed systems, the expected count belongs to the window, not to the circuit as a whole.

Repeat these checks as circuit size or discretisation changes. A finer scan alone may not resolve conditioning or root-finding failures. Incomplete mode sets or inconsistent energy normalisation can affect participation ratios and nonlinear results even when some frequencies look plausible.

## Validate participation and energy

Compare frequencies, linewidths, and participation ratios before comparing derived Kerr coefficients. Agreement in a derived quantity alone can hide compensating errors.

For a transmission line, check the energy convention and normalisation against an analytic case or independent integration. For example, the instantaneous inductive energy uses the density `L' I(x)^2 / 2`; cycle-averaged energy depends on whether amplitudes are peak or RMS. Check units and amplitude conventions before comparing prefactors.

Useful validation cases include a shorted line, the electrically short limit, and a converged lumped approximation. Keep those checks and their measured tolerances in the host project; agreement on one circuit does not establish accuracy for every configuration.

## Record modelling assumptions

- Inspect the effective-permittivity and phase-velocity model. A simplified dielectric model produces electrical lengths under that approximation; validate physical dimensions separately for a fabrication geometry.
- Record the relation between junction inductance and Josephson energy, including units. Independently supplied values must describe the same junction.
- Verify the Hamiltonian convention behind Kerr values. State whether a reported value is a signed shift or an unsigned magnitude.

## Handle parameter sweeps explicitly

Choose search windows and solver brackets that follow the intended modes as parameters change. When a solve fails, report the parameters and window; distinguish an empty window from a numerical failure. Bounded retries with smaller steps or adjusted windows can help, but should not silently switch mode identity or hide missing solutions.
