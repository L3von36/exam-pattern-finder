// Sample exam content users can load with one click to try the analyzer.
// Each sample is a representative past exam, designed to surface clear patterns
// when fed through the analyzer (topic clusters, question type mixes, difficulty).

export type SampleExam = {
  id: string
  title: string
  subject: string
  level: string
  blurb: string
  content: string
}

export const SAMPLE_EXAMS: SampleExam[] = [
  {
    id: 'bio-midterm',
    title: 'Biology 101 — Midterm Exam',
    subject: 'Biology',
    level: 'Undergraduate Year 1',
    blurb: 'Cell biology, genetics and ecology — 25 mixed-format questions.',
    content: `BIOLOGY 101 — MIDTERM EXAM (90 minutes)

Section A — Multiple Choice (2 marks each)

1. Which organelle is the primary site of ATP production in eukaryotic cells?
   a) Nucleus   b) Mitochondrion   c) Golgi apparatus   d) Lysosome

2. During mitosis, sister chromatids separate during which phase?
   a) Prophase   b) Metaphase   c) Anaphase   d) Telophase

3. In DNA, adenine always pairs with which nitrogenous base?
   a) Guanine   b) Cytosine   c) Thymine   d) Uracil

4. Which kingdom of life is composed entirely of unicellular prokaryotes?
   a) Protista   b) Fungi   c) Plantae   d) Monera

5. The fluid mosaic model describes the structure of which organelle?
   a) Cell wall   b) Plasma membrane   c) Mitochondrial cristae   d) Nuclear envelope

6. Which process converts light energy into chemical energy in plants?
   a) Respiration   b) Photosynthesis   c) Transpiration   d) Translocation

7. In a food chain, primary consumers are typically:
   a) Producers   b) Herbivores   c) Carnivores   d) Decomposers

8. Which of the following is NOT a nitrogenous base found in DNA?
   a) Adenine   b) Guanine   c) Uracil   d) Cytosine

9. The genetic code is read in groups of how many nucleotides?
   a) 1   b) 2   c) 3   d) 4

10. Which structure in the leaf regulates gas exchange?
    a) Cuticle   b) Xylem   c) Phloem   d) Stomata

Section B — Short Answer (4 marks each)

11. Explain the role of ribosomes in protein synthesis.
12. Describe two differences between mitosis and meiosis.
13. Outline the steps of the carbon cycle, naming one biological process at each step.
14. Explain how natural selection leads to adaptation in a population, using the peppered moth as an example.
15. Compare and contrast aerobic and anaerobic respiration in terms of ATP yield and end products.

Section C — Extended Response (10 marks)

16. A farmer notices that a strain of crop is resistant to a particular pest. Design an experiment to determine whether the resistance is genetic or environmental. Include hypothesis, variables, controls, and predicted outcomes.

17. Discuss the ecological consequences of introducing a non-native predator into a stable ecosystem. Your answer should refer to at least three trophic levels.

Section D — Data Analysis (10 marks)

18. The table below shows the number of bacteria (in millions) in a culture over 6 hours.

| Time (h) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| Count   | 2 | 4 | 8 | 16 | 32 | 64 | 128 |

a) Plot the data and describe the shape of the curve.
b) Calculate the doubling time of the population.
c) Predict the count at 8 hours, and state one assumption you made.

Section E — Application (10 marks)

19. A patient presents with fatigue and low red blood cell count. Using your knowledge of respiration and transport, propose a hypothesis for their symptoms and suggest two tests to confirm your hypothesis.

20. Evaluate the ethical implications of one modern biotechnology application of your choice (e.g., CRISPR, GM crops, cloning).
`,
  },
  {
    id: 'history-final',
    title: 'World History — Final Exam',
    subject: 'History',
    level: 'High School Senior',
    blurb: 'Industrial Revolution through Cold War — mixed source-based and essay.',
    content: `WORLD HISTORY — FINAL EXAM (120 minutes)

Section A — Source-Based Questions (5 marks each)

Source 1: An excerpt from a 19th-century factory inspector's report describing child labour in textile mills in Manchester, 1842.

1. According to the source, what were the working conditions faced by children in the mills? (2)
2. What does the source reveal about the priorities of factory owners at the time? (3)

Source 2: An excerpt from the Truman Doctrine speech, 1947.

3. What was Truman's stated justification for U.S. intervention in Greece and Turkey? (3)
4. Explain how this source reflects the broader foreign policy of containment. (2)

Section B — Multiple Choice (2 marks each)

5. The Industrial Revolution began in which country?
   a) France   b) Britain   c) Germany   d) United States

6. Who wrote the Communist Manifesto with Karl Marx in 1848?
   a) Vladimir Lenin   b) Friedrich Engels   c) Leon Trotsky   d) Joseph Stalin

7. The Treaty of Versailles was signed in which year?
   a) 1918   b) 1919   c) 1920   d) 1921

8. Which event triggered the start of World War I?
   a) German invasion of Poland   b) Sinking of the Lusitania   c) Assassination of Archduke Franz Ferdinand   d) Russian Revolution

9. The policy of apartheid was enforced in which country?
   a) Rhodesia   b) South Africa   c) Namibia   d) Algeria

10. The Cold War was primarily a conflict between which two superpowers?
    a) Britain and France   b) USA and USSR   c) China and Japan   d) NATO and the UN

Section C — Short Answer (4 marks each)

11. Identify two causes of the Industrial Revolution in Britain.
12. Outline three social consequences of urbanisation in the 19th century.
13. Explain the term "scramble for Africa" and give one example.
14. Describe the immediate impact of the Russian Revolution on the conduct of World War I.

Section D — Extended Response (15 marks each)

15. "The Treaty of Versailles was the principal cause of the Second World War." To what extent do you agree with this statement? Support your argument with at least three pieces of historical evidence.

16. Compare and contrast the causes of the Cold War in Europe and in Asia. In your answer, refer to specific events between 1945 and 1953.

Section E — Document Analysis (15 marks)

17. Study Documents A, B and C provided (an extract from Churchill's "Iron Curtain" speech, a Soviet response, and a memo from the U.S. State Department). Compare the perspectives each document presents on post-war Europe, and evaluate which is most persuasive, giving reasons for your judgement.
`,
  },
  {
    id: 'math-quiz',
    title: 'Algebra II — Unit Quiz',
    subject: 'Mathematics',
    level: 'High School Junior',
    blurb: 'Quadratics, logarithms, sequences — 8 short computational problems.',
    content: `ALGEBRA II — UNIT QUIZ (45 minutes)

1. Solve for x: 2x + 5 = 17. (2 marks)

2. Factorise the expression: x^2 + 7x + 12. (2 marks)

3. Solve the quadratic equation by factorisation: x^2 - 5x + 6 = 0. (3 marks)

4. Solve the quadratic equation using the quadratic formula: 2x^2 + 3x - 2 = 0. (3 marks)

5. Simplify the expression: log_2(8) + log_2(16). (3 marks)

6. Solve for x: log_3(x) + log_3(x - 2) = 1. (4 marks)

7. Find the sum of the first 10 terms of the arithmetic sequence: 3, 7, 11, 15, ...
   (4 marks)

8. The 3rd term of a geometric sequence is 12 and the 6th term is 96. Find the first term and the common ratio, then compute the 10th term. (6 marks)

9. Solve the simultaneous equations:
   y = 2x - 1
   y = -x + 5
   (3 marks)

10. The area of a rectangle is 24 cm^2 and its length is 2 cm longer than its width. Form an equation and solve to find the dimensions of the rectangle. (5 marks)
`,
  },
  {
    id: 'english-comprehension',
    title: 'English Literature — Paper 2',
    subject: 'English',
    level: 'High School Senior',
    blurb: 'Unseen poetry and Shakespeare — analytical essays.',
    content: `ENGLISH LITERATURE — PAPER 2 (120 minutes)

Section A — Unseen Poetry (20 marks)

Read the provided poem carefully and answer the following.

1. Identify two poetic devices used by the poet and explain their effect. (4 marks)

2. In a short essay of approximately 300 words, analyse how the poet creates a sense of longing in the poem. In your response, refer closely to at least three features of the poem (such as imagery, structure, sound, or diction). (16 marks)

Section B — Shakespeare (20 marks)

3. "In 'Macbeth', ambition is both a virtue and a curse." Write an essay of approximately 500 words evaluating this statement. In your answer, you should refer to at least two scenes from the play and explore how Shakespeare uses language to dramatise ambition. (20 marks)

Section C — Comparative Texts (20 marks)

4. Compare how two of the texts you have studied this year present the theme of isolation. Your essay should be approximately 500 words and should make use of comparative connectives throughout. (20 marks)

Section D — Language Analysis (10 marks)

5. Read the supplied newspaper editorial. Identify and comment on three rhetorical strategies the writer uses to persuade the reader. (10 marks)

Section E — Creative Response (10 marks)

6. Write a 250-word monologue in the voice of a minor character from a text you have studied. Your monologue should reveal something about the character that is not explicit in the original text. (10 marks)
`,
  },
]

export function getSampleExam(id: string): SampleExam | undefined {
  return SAMPLE_EXAMS.find((s) => s.id === id)
}
