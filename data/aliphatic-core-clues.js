// Phase 4 supplement: contextual clues for the 63 high-priority core terms.
// The canonical answers and level-1 definitions remain in the source JSON so
// that the attached master data can be audited independently.
export const ALIPHATIC_CORE_CLUES = Object.freeze({
  chain_hydrocarbon: {
    level: 2,
    type: "classification",
    text: "脂環式や芳香族と区別され、炭素骨格が枝分かれを含む鎖状の分類。",
  },
  saturated_hydrocarbon: {
    level: 2,
    type: "classification",
    text: "アルカンが属し、炭素原子間に多重結合をもたない炭化水素。",
  },
  unsaturated_hydrocarbon: {
    level: 2,
    type: "classification",
    text: "アルケンやアルキンのように、炭素原子間の多重結合をもつ炭化水素。",
  },
  functional_group: {
    level: 2,
    type: "structure",
    text: "ヒドロキシ基やカルボキシ基のように、有機化合物の性質を決める部分。",
  },
  structural_isomer: {
    level: 2,
    type: "concept",
    text: "分子式は同じでも、原子どうしの結び付き方が異なる関係。",
  },
  cis_trans_isomer: {
    level: 2,
    type: "concept",
    text: "二重結合の回転が制限されるために生じる、置換基の位置関係の違い。",
  },
  enantiomer: {
    level: 2,
    type: "concept",
    text: "互いに鏡に映した形の関係にあり、重ね合わせられない一対の異性体。",
  },
  chiral_carbon: {
    level: 2,
    type: "structure",
    text: "4種類の異なる原子または原子団と結合し、鏡像異性体の原因となる炭素原子。",
  },
  hydroxy_group: {
    level: 2,
    type: "structure",
    text: "アルコールの特徴となる、酸素と水素からなる官能基。",
  },
  carboxy_group: {
    level: 2,
    type: "structure",
    text: "カルボン酸の特徴となる、カルボニル基とヒドロキシ基をあわせた部分。",
  },
  alkyl_group: {
    level: 2,
    type: "structure",
    text: "アルカンから水素原子を1個取り去ってできる置換基。",
  },
  alkane: {
    level: 2,
    type: "formula",
    text: "鎖式の代表では一般式 CnH2n+2 で表される炭化水素の系列。",
  },
  alkene: {
    level: 2,
    type: "structure",
    text: "炭素原子間に二重結合 C=C を1つもつ鎖式炭化水素の系列。",
  },
  alkyne: {
    level: 2,
    type: "structure",
    text: "炭素原子間に三重結合 C≡C をもつ鎖式炭化水素の系列。",
  },
  methane: {
    level: 2,
    type: "formula",
    text: "分子式 CH4。天然ガスの主成分である最も簡単な炭化水素。",
  },
  ethane: {
    level: 2,
    type: "formula",
    text: "分子式 C2H6。炭素原子2個が単結合でつながる炭化水素。",
  },
  ethylene: {
    level: 2,
    type: "reaction",
    text: "分子式 C2H4。水を付加するとエタノールになり、付加重合もする物質。",
  },
  acetylene: {
    level: 2,
    type: "formula",
    text: "分子式 C2H2。炭素原子どうしが三重結合している最も簡単なアルキン。",
  },
  substitution: {
    level: 2,
    type: "reaction",
    text: "アルカンが光のもとでハロゲンと反応するときの、原子や原子団の入れ替わり。",
  },
  addition: {
    level: 2,
    type: "reaction",
    text: "アルケンやアルキンの多重結合に、水素やハロゲンなどが結び付く反応。",
  },
  oxidation: {
    level: 2,
    type: "reaction",
    text: "第一級アルコールがアルデヒド、さらにカルボン酸へ変化するときの反応。",
  },
  dehydration: {
    level: 2,
    type: "reaction",
    text: "アルコールから水が取れ、条件によってアルケンやエーテルを生じる反応。",
  },
  alcohol: {
    level: 2,
    type: "classification",
    text: "飽和炭素原子にヒドロキシ基が結合した有機化合物の総称。",
  },
  primary_alcohol: {
    level: 2,
    type: "reaction",
    text: "酸化するとアルデヒドを経てカルボン酸になりうるアルコールの分類。",
  },
  secondary_alcohol: {
    level: 2,
    type: "reaction",
    text: "酸化するとケトンになるアルコールの分類。",
  },
  tertiary_alcohol: {
    level: 2,
    type: "reaction",
    text: "ヒドロキシ基の付いた炭素が3個の炭素原子と結合し、酸化されにくいアルコール。",
  },
  methanol: {
    level: 2,
    type: "reaction",
    text: "酸化するとホルムアルデヒドになる、有毒性に注意が必要な最も簡単なアルコール。",
  },
  ethanol: {
    level: 2,
    type: "reaction",
    text: "エチレンへの水の付加で得られ、酸化するとアセトアルデヒドになる物質。",
  },
  ethylene_glycol: {
    level: 2,
    type: "structure",
    text: "炭素原子2個にヒドロキシ基を2個もつ二価アルコール。",
  },
  glycerol: {
    level: 2,
    type: "reaction",
    text: "油脂を加水分解またはけん化したときに得られる三価アルコール。",
  },
  intermolecular_dehydration: {
    level: 2,
    type: "reaction",
    text: "2分子のエタノールから水が取れ、ジエチルエーテルを生じる脱水。",
  },
  intramolecular_dehydration: {
    level: 2,
    type: "reaction",
    text: "1分子のエタノールから水が取れ、エチレンを生じる脱水。",
  },
  ether: {
    level: 2,
    type: "structure",
    text: "酸素原子が2つの炭化水素基の間に入った R−O−R' 型の化合物。",
  },
  diethyl_ether: {
    level: 2,
    type: "reaction",
    text: "エタノール2分子の分子間脱水で生じる代表的なエーテル。",
  },
  aldehyde: {
    level: 2,
    type: "property",
    text: "分子の端にカルボニル基をもち、銀鏡反応やフェーリング反応を示す化合物。",
  },
  aldehyde_group: {
    level: 2,
    type: "structure",
    text: "アルデヒドの特徴となる、分子末端の −CHO で表される官能基。",
  },
  formaldehyde: {
    level: 2,
    type: "classification",
    text: "水溶液がホルマリンとして知られる、最も簡単なアルデヒド。",
  },
  acetaldehyde: {
    level: 2,
    type: "reaction",
    text: "エタノールを穏やかに酸化して得られ、さらに酸化すると酢酸になる物質。",
  },
  ketone: {
    level: 2,
    type: "structure",
    text: "カルボニル基の炭素原子が2つの炭化水素基と結合した化合物。",
  },
  acetone: {
    level: 2,
    type: "reaction",
    text: "2-プロパノールを酸化して得られる、最も簡単なケトン。",
  },
  silver_mirror: {
    level: 2,
    type: "reaction",
    text: "アルデヒドがアンモニア性硝酸銀中の銀イオンを還元して、銀を析出させる反応。",
  },
  fehling: {
    level: 2,
    type: "reaction",
    text: "アルデヒドがアルカリ性の銅(II)イオンを還元し、赤色の沈殿を生じる反応。",
  },
  iodoform_reaction: {
    level: 2,
    type: "reaction",
    text: "メチルケトン、または CH3CH(OH)− をもつ化合物が黄色沈殿を生じる反応。",
  },
  carboxylic_acid: {
    level: 2,
    type: "structure",
    text: "カルボキシ基をもち、水溶液中で酸性を示す有機化合物の総称。",
  },
  formic_acid: {
    level: 2,
    type: "property",
    text: "カルボン酸でありながら銀鏡反応を示す、最も簡単なカルボン酸。",
  },
  acetic_acid: {
    level: 2,
    type: "reaction",
    text: "エタノールを十分に酸化して得られ、エタノールとエステル化する酸。",
  },
  oxalic_acid: {
    level: 2,
    type: "formula",
    text: "分子式 H2C2O4、または HOOC−COOH で表される最も簡単なジカルボン酸。",
  },
  maleic_acid: {
    level: 2,
    type: "concept",
    text: "ブテン二酸のシス形で、加熱すると分子内脱水して酸無水物になりやすい物質。",
  },
  fumaric_acid: {
    level: 2,
    type: "concept",
    text: "ブテン二酸のトランス形で、マレイン酸とシス-トランス異性体の関係にある物質。",
  },
  ester: {
    level: 2,
    type: "reaction",
    text: "カルボン酸とアルコールから水が取れる反応で生じる化合物の総称。",
  },
  ester_bond: {
    level: 2,
    type: "structure",
    text: "カルボン酸由来の −COO− で表され、油脂にも含まれる結合。",
  },
  esterification: {
    level: 2,
    type: "reaction",
    text: "カルボン酸とアルコールを濃硫酸などの触媒下で反応させ、水とともにエステルを得る反応。",
  },
  hydrolysis: {
    level: 2,
    type: "reaction",
    text: "エステルが水と反応して、カルボン酸とアルコールに分かれる反応。",
  },
  ethyl_acetate: {
    level: 2,
    type: "reaction",
    text: "酢酸とエタノールのエステル化で得られる、果実のような香りをもつ代表的なエステル。",
  },
  fat_oil: {
    level: 2,
    type: "structure",
    text: "グリセリンと高級脂肪酸のエステルで、けん化するとグリセリンとセッケンを生じる物質。",
  },
  higher_fatty_acid: {
    level: 2,
    type: "classification",
    text: "油脂を構成する、長い炭化水素鎖をもつカルボン酸の総称。",
  },
  saturated_fatty_acid: {
    level: 2,
    type: "classification",
    text: "炭化水素鎖中に炭素間二重結合をもたず、パルミチン酸やステアリン酸が属する脂肪酸。",
  },
  unsaturated_fatty_acid: {
    level: 2,
    type: "classification",
    text: "炭化水素鎖中に炭素間二重結合をもち、オレイン酸などが属する脂肪酸。",
  },
  stearic_acid: {
    level: 2,
    type: "classification",
    text: "炭素数18で二重結合をもたない、高級脂肪酸の代表例。",
  },
  oleic_acid: {
    level: 2,
    type: "classification",
    text: "炭素数18で二重結合を1個もつ、不飽和高級脂肪酸の代表例。",
  },
  saponification: {
    level: 2,
    type: "reaction",
    text: "油脂を水酸化ナトリウム水溶液などで加水分解し、グリセリンとセッケンを得る反応。",
  },
  soap: {
    level: 2,
    type: "classification",
    text: "高級脂肪酸のナトリウム塩またはカリウム塩で、界面活性剤としてはたらく物質。",
  },
  iodine_value: {
    level: 2,
    type: "property",
    text: "油脂100 gが付加できるヨウ素の質量で、不飽和結合の多さの目安となる値。",
  },
});
