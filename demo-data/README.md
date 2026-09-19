# Demo genome

**We are not generating a synthetic genome.** There is a better option, and ClawBio's
own documentation argues the case: synthetic genotype data only exercises the happy
path. It has no missing SNPs, no awkward heterozygous calls, and no combinations that
produce genuinely actionable findings.

## What's here

`corpasome.txt.gz` — the **Corpasome**: Manuel Corpas's real 23andMe genotype,
published under **CC0 (public domain)** as one of the first fully open personal genomes.
576,518 SNPs. Byte-identical to what a user uploads from 23andMe.

> Corpas, M. (2013). Crowdsourcing the Corpasome. *Source Code for Biology and
> Medicine*, 8, 13. [doi:10.1186/1751-0473-8-13](https://doi.org/10.1186/1751-0473-8-13)

Unpack it with:

```bash
npm run genome:unpack
```

The uncompressed `.txt` is gitignored — regenerate it rather than committing it.

## Format

Tab-separated, four columns, `#` comments. Exactly what 23andMe exports:

```
# rsid  chromosome  position  genotype
rs3094315   1   742429   AA
rs12562034  1   758311   GG
rs3934834   1   995669   CT
```

## Using it for the demo account

The plan is to pair this genome with Owen's **real** WHOOP data in a demo account.

⚠️ **Label it honestly in the UI.** The licence permits any use, but presenting another
person's real genome as the account holder's own is a different problem from a licensing
one. The demo account should say the genetics are sample data. "Demo genome" is enough.

## If we ever do need synthetic data

ClawBio ships one: `skills/gwas-prs/demo_patient_prs.txt` in the source checkout, used by
`--demo`. It only covers the PRS panels, not the full SNP chip.
