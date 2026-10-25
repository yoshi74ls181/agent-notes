# Driving Sonnet em from Python

How to write Sonnet projects from Python, solve them with Sonnet em 19.54 on Windows from the command line, and take capacitances and inductances out of the result without trusting a port em has silently dropped.
Sonnet is a planar method-of-moments solver: metal is sheets on the interfaces of a stack of uniform dielectric layers, joined by vertical vias, inside a box with conducting side walls.

## Running em

- Solve with `em.exe -v NAME.sonx`, run from the project's directory; the executable is `C:\Program Files\Sonnet Software\19.54.2026\bin\em.exe`.
  The command `em.exe -N NAME.sonx` prints the subsection count and the memory estimate and solves nothing; run it before a large solve.
  A non-zero exit code means em failed, and its messages are in the output and in `sondata/NAME/log_errors.log`.
- **Delete `sondata/NAME/` before solving a changed project.**
  The solver keeps its response data there and refuses a project that no longer matches it: "Response data is inconsistent with project file. Project must be cleaned".
- Writing the project and reading the result need only numpy, so any Python runs the driver.
- **Run one field solve at a time on a machine**, em or any other solver; two at once can exhaust memory.

## Writing the project

- Write the `.sonx` XML directly: units, a dielectric list, the box, one `Level` per dielectric layer from the top with its metal as a `PlanarTechLayer`, vias as `ViaTechLayer`, the frequency sweep and a Touchstone output file.
- **Sonnet's y runs down the page from the box's top edge.**
  With `YDirection="Negative"` and the local origin at the box's top-left corner, a layout's y becomes the box's top y minus y.
- **Put the box and every edge on the cell grid.**
  The box is a whole number of square cells, and an edge between grid lines is moved onto one.
  An off-grid box origin drops ports silently.
- Zero-thickness metal is `ModelType="THIN_METAL"` with `Thickness="0.0"`; it sits at the bottom of its level, so each metal plane is the top of the layer beneath it.
  A via joins two metal levels; `ModelType="VOLUME"` with `Solid="TRUE"` makes it a solid conductor.
- Abutting polygons of one metal are one conductor, so a conductor may be drawn as many rectangles; resolve overlaps into disjoint rectangles before writing them.
- **Put vacuum directly above a free-space bottom cover.**
  The solver warns, "Circuit does not have air layer immediately above free space bottom cover", when the lowest layer over a free-space cover is a dielectric; add a vacuum layer under the substrate.
- The side walls are perfect conductors, so a model whose ground plane reaches the box's edges has that ground on the walls.
- **Give a capacitance extraction the real substrate thickness.**
  A thinner substrate under a ground plane with a pocket lowers every capacitance to ground.

## Meshing

- `SubsectionMeshing XMax`/`YMax` caps a subsection's length, in cells, inside a polygon.
  With `EdgeMeshed="TRUE"` the subsections along an edge are one cell wide whatever the cap, so the cell size, not the cap, sets how finely an edge's charge is resolved.
- **Converge on the cell size as well as on the cap.**
  Halving the cap tests the interiors only.
- **Treat a capacitance across a gap smaller than the cell as unconverged until a cell-size sweep shows otherwise.**

## Ports

- A `GAP` (delta-gap) port sits on a polygon's edge between that polygon and its neighbour; a `BOX` port sits on an edge that touches a box wall.
- **em takes a port as the whole polygon edge it lies on, and drops a gap port whose centre point is not that edge's midpoint.**
  Split the polygon so that the port's edge is centred on its point.
- At most two polygon edges may coincide with a gap port's edge; a third is an error ("Delta-gap port N cannot be constructed").
- **Check every port in the result.**
  A port em dropped reads as a row of Z equal to the termination, 50 Ω, with zeros off the diagonal.
- Touchstone Z is normalised to the option line's R; multiply it back before using it.
- A gap port's polarity follows which polygon carries it, so fix each port's sign from the physics: every off-diagonal of a capacitance matrix is negative, and every branch of an inductive network looks inductive.

## Capacitance and inductance from Z

- Give every floating conductor a gap port to a conductor it can reach: a narrow strip of ground across its pocket to it, or a post beside a small island on a via to the metal below.
- Solve at a frequency where the model is electrically small.
  Then the nodal capacitance matrix is C = A⁻ᵀ (Im Y / ω) A⁻¹, with Y = Z⁻¹ and A the matrix that gives each net's voltage from the ports' voltages.
- **A port beside a small capacitance changes it.**
  Keep each port away from the capacitances it measures; where that is impossible, as for an island with a port beside it, solve twice with the port at each of two equivalent places and take each entry from the solve whose port is far from it.
- An inductance is Im Z / ω from a port across the loop: M = Im Z₁₂ / ω between two ports, and L from the diagonal.
  Solve at two or more frequencies and check that they agree.
