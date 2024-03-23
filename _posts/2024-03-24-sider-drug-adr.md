---
title: "Predicting drug ADR using SIDER dataset"
layout: "post"
---

## Steps
1. developing an idea
2. literature review
3. list the objectives
4. design your study
5. obtain necessary approvals
6. perform experiments
7. collects and analyze data
8. prepare a draft manuscript
9. create figures and tables
10. revise and finalize
11. select a suitable journal
12. write a cover letter
13. submit manuscript
14. peer review
15. revise and resubmit
16. final acceptance
17. proofreading and formatting
18. publication

## Links
- README: http://sideeffects.embl.de/media/download/README
- homepage: http://sideeffects.embl.de/download/
- Colab Notebook: 
## Medical Information
### general
- **ADRs causes**:
	1. The pharmacological effects of the drug
	2. The dose of the drug
	3. The duration of treatment
	4. The individual's age, weight, and health condition
	5. Other drugs that the individual is taking
- **common ADRs**: Nausea, Vomiting, Diarrhea, Constipation, Headache, Dizziness, Drowsiness, Skin rash, Itching, Swelling, Pain
- **more severe ADRs**: Liver damage, Kidney damage, Heart problems, Stroke, Anaphylaxis
- **ADRs can be prevented by**:
	- Taking medications as prescribed
	- avoiding taking multiple medications that have similar side effects
- **severity of ADR**: The terms "severe" and "serious", when applied to adverse events, are technically very different. Seriousness usually indicates patient outcome (such as negative outcomes including disability, long-term effects, and death.
### differences between ADR and side effect

| Feature        | ADR                                                                                                                                                                                                                          | Side effect                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Definition     | Harmful or unpleasant reaction to a drug                                                                                                                                                                                     | Any unintended effect of a drug                                                                                         |
| Severity       | Can range from mild to life-threatening                                                                                                                                                                                      | Can be mild, moderate, or severe                                                                                        |
| Predictability | Usually unpredictable                                                                                                                                                                                                        | Often predictable                                                                                                       |
| Prevention     | Can be prevented by taking medications as prescribed, avoiding taking multiple medications with similar side effects, telling your doctor about all of the medications you are taking, and reporting any ADRs to your doctor | Can be prevented by taking medications as prescribed and avoiding taking multiple medications with similar side effects |
| Treatment      | Treatment depends on the severity of the ADR                                                                                                                                                                                 | Treatment depends on the severity of the side effect                                                                    |
| Discovery      | side effects are known and expected reactions to a medication                                                                                                                                                                | ADRs are unexpected and are discovered through monitoring and reporting systems.                                        |
### ADR [classification](https://en.wikipedia.org/wiki/Adverse_drug_reaction#Classification)
- **traditional**:
	1. **Type A** (augmented)
		- dose-dependent
		- predictable
		- approximately 80% of ADRs
		- a consequence of the drug's primary pharmacological effect (e.g., bleeding when using *warfarin*)
		- usually mild but can be fatal too
		- The term “[side effects](https://en.wikipedia.org/wiki/Side_effect)” may be applied to minor type A reactions.
	1. **Type B** (bizarre or [idiosyncratic](https://en.wikipedia.org/wiki/Idiosyncratic_drug_reaction))
		- uncommon
		- not dose-dependent
		- unpredictable
		- can be due to particular elements within the person or the environment.
	1. **Type C** (chronic)
		- uncommon
		- dose-dependent
		- time-dependent
		- persists for longer
	1. **Type D** (delayed)
		- occurs due to prolonged use
		- uncommon
		- dose-dependent
		- considerable lag time
	1. **Type E** (end of use)
		- uncommon
		- related to withdrawal ADRs (commonly known in opioids)
	1. **Type F**: (failure of therapy as an ADR)
		- drug undesirably increases/decreases efficacy
		- common
		- dose-dependent
		- caused by drug interactions
- **seriousness**: is serious when the patient outcome is one of the following:
	1. *Death*
	2. *Life-threatening*
	3. *Hospitalization* (initial or prolonged)
	4. *Disability*: significant, persistent, or permanent change, impairment, damage, or disruption in the patient's body function/structure, physical activities or quality of life.
	5. *Congenital abnormality*
	6. *requires intervention* to prevent permanent impairment or damage.
### terms
- **placebo**: a fake medication
- **package inserts**: documents that provide information about prescription medications. exist in the drug package.
- **STITCH**: *Search Tool for Interactions of Chemicals*. a database that contains information on the interactions between chemical compounds and proteins.
	- used to identify and track chemical compounds.
	- STITCH compound IDs can also be found in other databases, such as PubChem and ChEMBL.
	- **flat ID**: 10-digit numbers, such as *1234567890*. Each corresponds to a specific chemical compound, regardless of its stereochemistry.
	- **stereo ID**: 11-digit numbers, such as *12345678901*. each assigned to stereoisomers of chemical compounds in the STITCH database.
		- **Stereoisomers**: molecules that have the same molecular formula and connectivity, but differ in the spatial arrangement of their atoms.
- **UMLS**: *Unified Medical Language System*. a large, comprehensive biomedical ontology that contains information on over 4 million concepts and their relationships.
	- concepts like a disease, symptom, drug, or medical procedure.
	- 8-digit numbers, such as *C0011849*
	- UMLS concept IDs, can also be found in other databases, such as the National Library of Medicine's Medical Subject Headings (MeSH) database.
- **MedDRA**: *Medical Dictionary for Regulatory Activities* is a standardized medical terminology that is used to encode adverse events and other safety information in clinical trials and other regulatory submissions.
	- 8-digit numbers, such as *10000001*.
	- Each MedDRA concept represents a specific medical condition, symptom, or other event.
	- organized into a hierarchical structure, with more general concepts at the top of the hierarchy and more specific concepts at the bottom.
	- For example, the concept of “adverse event” is a parent concept that has many child concepts, such as “headache”, “nausea”, and “vomiting”.
		- **MedDRA concept type**: classification that indicates the type of medical concept.
		- for example, the MedDRA concept “headache” has the following concept types: HLGT: Adverse events ⇾ HLT: Headache disorders ⇾ PT: Headache ⇾ LLT: Headache, tension type ⇾ ST: Headache, severe
			- **High Level Group Term (HLGT)**: HLGTs are the most general MedDRA concept types such as “adverse events”, “diseases”, and “investigations”.
			- **High Level Term (HLT)**: HLTs are more specific than HLGTs. specific types of medical concepts, such as “headache”, “nausea”, and “vomiting”.
			- **Preferred Term (PT)**: PTs are the most specific MedDRA concept types. They represent specific medical conditions, symptoms, or other events.
			- **Lower Level Term (LLT)**: Represents an even more specific medical condition, symptom, or other event. Organized into a hierarchical structure, with more general LLTs at the top.
			- **Supplementary Term (ST)**: STs are used to provide additional information about PTs. Can specify the severity, location, or other characteristics of an adverse event

## Similar Works
similar work


## backyard
ADR stands for Adverse Drug Reaction. It refers to any harmful or unwanted reaction that occurs after taking a medication or drug. ADRs can range from mild side effects, like nausea or drowsiness, to severe reactions that can be life-threatening.

The main difference between ADRs and side effects is that side effects are known and expected reactions to a medication, while ADRs are unexpected and harmful reactions that were not anticipated based on the known effects of the drug. Side effects are often listed on the drug's label or informational materials, while ADRs are discovered through monitoring and reporting systems.

To diagnose and analyze ADRs, several methods are used. Healthcare professionals rely on patient reports, clinical observations, and laboratory tests to identify potential ADRs. They consider the timing of the reaction in relation to drug administration and rule out other possible causes. Once an ADR is suspected, it is reported to regulatory authorities, such as the Food and Drug Administration (FDA) in the United States, who collect and analyze data from healthcare providers and patients to evaluate the safety of drugs.

Predicting ADRs is a complex process that involves multiple approaches. One method is pharmacovigilance, which involves monitoring and collecting data on the safety of drugs after they have been approved and are on the market. This helps identify ADRs that were not detected during the drug development process. Additionally, researchers use computer algorithms and data mining techniques to analyze large datasets and identify patterns that may indicate potential ADRs. Genetic testing and biomarker analysis are also used to predict the likelihood of an individual experiencing an ADR based on their genetic makeup.

It's important to note that predicting ADRs accurately is challenging, as individual responses to drugs can vary widely. Ongoing research and monitoring are crucial to improve our understanding of ADRs and enhance patient safety when using medications.
