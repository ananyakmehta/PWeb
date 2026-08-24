---
title: "Torque ML Project"
slug: "torque-ml"
status: "completed"
priority: 3
dateStart: "2023-01"
dateEnd: "2023-12"
typeTags: ["project", "research"]
topicTags: ["ml", "signal-processing"]
cardSummary: "[Placeholder] Predicting torque output from sensor data with ML."
primaryDescription: |
  I built an ML pipeline that predicts joint torque from motion (joint kinematics) alone using OpenSim musculoskeletal simulation to generate biomechanically realistic training data across four injury-risk severity levels. The goal here wasn't really the prediction itself, but to use ML's inference capability as a marker of relative significance for joint kinematics vs. joint torque. A 1D CNN was trained on both joint kinematics and joint torques, both with varying severity levels, after which it was asked to classify severity with only joint kinematics.

  This project was in response to me and my teammates' experience as combat athletes. In martial arts, there isn't really an accurate way to tell whether something is an injury-risk, because of the variation of movements we do. I, along with many of my teammates, have suffered injuries from prolonged dangerous movement, and didn't know until the damage was already done.

  In general, analyzing joint load across different movements requires time, money, lab equipment (force plates), etc. that the majority of people don't have access to. The goal of this study was to understand whether it would be plausible to use joint kinematics only to get an accurate severity measure, which can be easily derived from videos or mocap data.
links:
  - label: "Repo"
    url: "#"
  - label: "Docs"
    url: "#"
heroImage:
  src: "../../assets/blocks/torque-ml/hero.svg"
  alt: "Placeholder hero image for Torque ML Project"
images:
  - src: "../../assets/blocks/torque-ml/1.svg"
    alt: "Placeholder image for Torque ML Project"
    caption: "[Placeholder image] Model diagram — filler"
tools: ["PyTorch", "Python", "Pandas"]
sections:
  - heading: "OpenSim + Sim Setup"
    body: |
      The simulation side runs on OpenSim's Rajagopal musculoskeletal model, a full-body model with realistic joint constraints and muscle geometry. My first approach was to pull mocap data from CMU or AMASS, and convert them to OpenSim's format to run inverse kinematics and inverse dynamics. Unfortunately, OpenSim is quite unforgiving when it comes to formatting, spacing, etc. in input files, making conversion a pretty nasty task at this scale. Instead, I switched to starting from OpenSim's own example walking trials and perturbing it directly, so every trial generated would work with OpenSim.
  - heading: "Perturbation + Severity Labeling"
    body: |
      To ensure realism, perturbations had to be physically grounded. I started with a single baseline running trial, and generated 200 samples per severity band by distorting joint kinematics and GRFs of that baseline. OpenSim's inverse dynamics solver can calculate resulting torque, which determines a trial's severity.
    nerdNumbers: |
      The kinematic perturbation centered on knee valgus, scaled to four ranges: 0-0.5° for S0, 3-4° for S1, 6-7° for S2, and 10-12° for S3, applied through a smooth Gaussian time-window so the added deviation rose and fell naturally over the gait cycle. To spread the distortion naturally out from the knee, a randomized 0.3-0.6 coupling factor carried part of it into hip adduction, and a smaller 0.2-0.4 factor carried it into pelvic list. I did this to mirror how a knee collapse recruits movement at the hip and pelvis rather than happening in one joint alone. Ground reaction force scaled separately, from 1.0x at S0 up to 1.5x at S3, with an extra stance-phase overload window that increased vertical force during the part of the gait cycle where load-bearing tends to peak.

      On top of the deliberate distortion, every trial had low-amplitude, smoothed random noise added to both the kinematics and the force channels, scaled up slightly with severity. Raw per-frame random noise didn't end up looking like anything a real joint does, so I convolved noise into a smooth rolling signal before being added, closer to natural trial-to-trial variation. Two hundred samples were generated per severity level this way, for 800 trials total.
  - heading: "Model Architecture + Kinematics-Only Test"
    body: |
      The classifier is a compact 1D convolutional network, with two convolutional layers feeding into global average pooling and a final linear layer that outputs one of four severity classes. I used the same architecture for both input conditions (kinematics + GRFs, and kinematics alone), since we were looking for any performance difference between them.
    nerdNumbers: |
      Each trial is a multivariate time series, 39 channels by 72 timesteps for the combined kinematics-plus-GRF version, cut to the first 30 channels for the kinematics-only version. The first convolutional layer expands that into 64 feature maps, the second into 128, both with a kernel size of 5. Adaptive average pooling collapses the time dimension down to a single value per feature map before the final linear layer, and dropout=0.3 between pooling and the classifier.

      Every one of the 50 independent trials retrained the model from scratch, with a random train/validation/test split each time, an 85/15 test split followed by a further split for train/val. Training ran for 40 epochs (optimizer = Adam) at a learning rate of 0.001, and inputs were standardized with a scaler fit only on the training data for that trial, so no information from the validation or test set leaked into how input was scaled.
  - heading: "Results"
    body: |
      Both trials were evaluated the same way, with 50 independent trials, each with a random split. Combined kinematics + GRF model had a mean 97.05% accuracy held-out accuracy across 50 trials, and kinematics only had a mean 96.6% accuracy. So, no force data cost very little in classification performance. For both trials, any confusion was also exclusively between neighboring severities (so no S4s being predicted as S1, or vice versa).

      Under 5% Gaussian noise added to the test inputs, a check for whether the model had just memorized clean-signal patterns, the combined model held at 97.1% and the kinematics-only model held at 95.35%, both comfortably above the 80% robustness threshold set going in.

      These results suggest joint kinematics alone carries most of the same signal that predicts torque-based severity, meaning using kinematics for severity calculations could be very plausible 🎉🎉
impact: "[Placeholder] This is a filler impact blurb standing in for a real one to two sentence summary of measured outcomes, which will be written once real results are finalized."
isOther: false
---
Body is intentionally unused — see src/content.config.ts for why primaryDescription
lives in frontmatter instead of here.
