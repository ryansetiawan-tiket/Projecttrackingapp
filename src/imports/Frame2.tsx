import svgPaths from "./svg-n8nfihkbnb";

function Badge() {
  return (
    <div className="bg-blue-50 h-[24.992px] relative rounded-[8px] shrink-0 w-[73.543px]" data-name="Badge">
      <div className="box-border content-stretch flex gap-[4px] h-[24.992px] items-center justify-center overflow-clip px-[10.502px] py-[4.502px] relative rounded-[inherit] w-[73.543px]">
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#1447e6] text-[12px] text-nowrap whitespace-pre">LOYALTY</p>
      </div>
      <div aria-hidden="true" className="absolute border-[#bedbff] border-[0.502px] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[12.5px] size-[11.999px] top-[8.49px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g clipPath="url(#clip0_10_587)" id="Icon">
          <path d={svgPaths.p4c7ad80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.999883" />
          <path d={svgPaths.pc7697c0} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.999883" />
        </g>
        <defs>
          <clipPath id="clip0_10_587">
            <rect fill="white" height="11.9986" width="11.9986" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Badge1() {
  return (
    <div className="bg-[#2b7fff] h-[28.989px] relative rounded-[8px] shrink-0 w-[115.668px]" data-name="Badge">
      <div className="h-[28.989px] overflow-clip relative rounded-[inherit] w-[115.668px]">
        <Icon />
        <p className="absolute font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[16px] left-[30.49px] not-italic text-[12px] text-nowrap text-white top-[7px] whitespace-pre">On Progress</p>
      </div>
      <div aria-hidden="true" className="absolute border-[#2b7fff] border-[0.502px] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[#ffd7d7] relative rounded-tl-[14px] rounded-tr-[14px] shrink-0 w-full">
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[106px] items-center justify-center px-[6px] py-[8px] relative w-full">
          <Badge />
          <Badge1 />
        </div>
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Bold',_sans-serif] font-bold leading-[22.5px] left-[0.01px] not-italic text-[#0f172b] text-[18px] top-[-0.44px] tracking-[-0.4395px] w-[298px]">Promo Paduka Campaign (Sultan)</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[23px] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="content-stretch flex h-[23px] items-start justify-between relative w-full">
          <Heading3 />
        </div>
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[67.487px] overflow-clip relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[22.75px] left-0 not-italic text-[#45556c] text-[14px] top-[1.01px] tracking-[-0.1504px] w-[294px]">Campaign untuk member loyal dengan sistem poin reward. Target: increase engagement by 25%</p>
    </div>
  );
}

function ProjectCard() {
  return (
    <div className="content-stretch flex flex-col gap-[11.999px] items-start relative shrink-0 w-full" data-name="ProjectCard">
      <Container />
      <Paragraph />
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[15.995px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-3/4 left-[33.33%] right-[66.67%] top-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-25%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 5">
            <path d="M1 1V3.66592" id="Vector" stroke="var(--stroke-0, #00A63E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-3/4 left-[66.67%] right-[33.33%] top-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-25%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 5">
            <path d="M1 1V3.66592" id="Vector" stroke="var(--stroke-0, #00A63E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[16.67%_12.5%_8.33%_12.5%]" data-name="Vector">
        <div className="absolute inset-[-5.56%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
            <path d={svgPaths.pe034d00} id="Vector" stroke="var(--stroke-0, #00A63E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[41.67%_12.5%_58.33%_12.5%]" data-name="Vector">
        <div className="absolute inset-[-0.67px_-5.56%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 2">
            <path d="M1 1H12.9966" id="Vector" stroke="var(--stroke-0, #00A63E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-green-100 relative rounded-[10px] shrink-0 size-[31.983px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start pb-0 pt-[7.994px] px-[7.994px] relative size-[31.983px]">
        <Icon1 />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[15.995px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[16px] left-0 not-italic text-[#62748e] text-[12px] text-nowrap top-[0.5px] tracking-[0.6px] uppercase whitespace-pre">Start Date</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[39.985px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#0f172b] text-[14px] top-[0.51px] tracking-[-0.1504px] w-[52px]">Sep 25, 2024</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[55.98px] relative shrink-0 w-[80.62px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[3.719e_-5px] h-[55.98px] items-start relative w-[80.62px]">
        <Container2 />
        <Container3 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute content-stretch flex gap-[11.999px] h-[55.98px] items-center left-0 top-0 w-[124.602px]" data-name="Container">
      <Container1 />
      <Container4 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[15.995px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[8.333%]" data-name="Vector">
        <div className="absolute inset-[-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
            <path d={svgPaths.p2f58b600} id="Vector" stroke="var(--stroke-0, #F54900)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-1/4" data-name="Vector">
        <div className="absolute inset-[-8.333%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
            <path d={svgPaths.p3d97a180} id="Vector" stroke="var(--stroke-0, #F54900)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[41.667%]" data-name="Vector">
        <div className="absolute inset-[-25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
            <path d={svgPaths.p36396d80} id="Vector" stroke="var(--stroke-0, #F54900)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-[#ffedd4] relative rounded-[10px] shrink-0 size-[31.983px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start pb-0 pt-[7.994px] px-[7.994px] relative size-[31.983px]">
        <Icon2 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[15.995px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[16px] left-0 not-italic text-[#62748e] text-[12px] text-nowrap top-[0.5px] tracking-[0.6px] uppercase whitespace-pre">Due Date</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[39.985px] relative shrink-0 w-full" data-name="Container">
      <p className="absolute font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#0f172b] text-[14px] top-[0.51px] tracking-[-0.1504px] w-[48px]">Oct 15, 2024</p>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[55.98px] relative shrink-0 w-[80.628px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[3.719e_-5px] h-[55.98px] items-start relative w-[80.628px]">
        <Container7 />
        <Container8 />
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute content-stretch flex gap-[11.999px] h-[55.98px] items-center left-[140.6px] top-0 w-[124.61px]" data-name="Container">
      <Container6 />
      <Container9 />
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[55.98px] relative shrink-0 w-full" data-name="Container">
      <Container5 />
      <Container10 />
    </div>
  );
}

function ProjectCard1() {
  return (
    <div className="bg-gradient-to-r from-[#f8fafc] h-[88.975px] relative rounded-[14px] shrink-0 to-[rgba(239,246,255,0.5)] w-full" data-name="ProjectCard">
      <div aria-hidden="true" className="absolute border-[0.502px] border-slate-200 border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[88.975px] items-start pb-[0.502px] pt-[16.497px] px-[16.497px] relative w-full">
          <Container11 />
        </div>
      </div>
    </div>
  );
}

function Badge2() {
  return (
    <div className="absolute bg-[#5f27cd] box-border content-stretch flex gap-[4px] h-[27.986px] items-center justify-center left-0 overflow-clip px-[12px] py-[6px] rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] top-0 w-[47.838px]" data-name="Badge">
      <p className="font-['Inter:Semi_Bold',_sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-white whitespace-pre">DLP</p>
    </div>
  );
}

function Badge3() {
  return (
    <div className="bg-slate-50 h-[24.992px] relative rounded-[8px] shrink-0 w-[82.862px]" data-name="Badge">
      <div className="box-border content-stretch flex gap-[4px] h-[24.992px] items-center justify-center overflow-clip px-[8.502px] py-[4.502px] relative rounded-[inherit] w-[82.862px]">
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#45556c] text-[12px] text-nowrap whitespace-pre">#Campaign</p>
      </div>
      <div aria-hidden="true" className="absolute border-[#cad5e2] border-[0.502px] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Badge4() {
  return (
    <div className="bg-slate-50 h-[24.992px] relative rounded-[8px] shrink-0 w-[63.355px]" data-name="Badge">
      <div className="box-border content-stretch flex gap-[4px] h-[24.992px] items-center justify-center overflow-clip px-[8.502px] py-[4.502px] relative rounded-[inherit] w-[63.355px]">
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#45556c] text-[12px] text-nowrap whitespace-pre">#PopUp</p>
      </div>
      <div aria-hidden="true" className="absolute border-[#cad5e2] border-[0.502px] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Badge5() {
  return (
    <div className="bg-slate-50 h-[24.992px] relative rounded-[8px] shrink-0 w-[96.968px]" data-name="Badge">
      <div className="box-border content-stretch flex gap-[4px] h-[24.992px] items-center justify-center overflow-clip px-[8.502px] py-[4.502px] relative rounded-[inherit] w-[96.968px]">
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#45556c] text-[12px] text-nowrap whitespace-pre">#High Priority</p>
      </div>
      <div aria-hidden="true" className="absolute border-[#cad5e2] border-[0.502px] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute content-stretch flex gap-[7px] items-start left-0 top-[39.98px] w-[153.217px]" data-name="Container">
      <Badge3 />
      <Badge4 />
      <Badge5 />
    </div>
  );
}

function ProjectCard2() {
  return (
    <div className="h-[97.964px] relative shrink-0 w-full" data-name="ProjectCard">
      <Badge2 />
      <Container12 />
    </div>
  );
}

function Container13() {
  return (
    <div className="relative shrink-0 size-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border size-0" />
    </div>
  );
}

function Container14() {
  return (
    <div className="h-[15.995px] relative shrink-0 w-[64.922px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border h-[15.995px] relative w-[64.922px]">
        <p className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[16px] left-0 not-italic text-[#62748e] text-[12px] top-[0.5px] w-[65px]">3 members</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[15.995px] relative shrink-0 w-[76.921px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[11.999px] h-[15.995px] items-center relative w-[76.921px]">
        <Container13 />
        <Container14 />
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="relative shrink-0 size-[15.995px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p353fed00} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          <path d={svgPaths.pf212500} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
          <path d={svgPaths.p22f181c0} id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33296" />
        </g>
      </svg>
    </div>
  );
}

function Container16() {
  return (
    <div className="bg-white relative rounded-[10px] shrink-0 size-[35.996px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.502px] border-slate-200 border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center p-[0.502px] relative size-[35.996px]">
        <Icon3 />
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[35.996px] relative shrink-0 w-[79.985px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex gap-[7.994px] h-[35.996px] items-start relative w-[79.985px]">
        {[...Array(2).keys()].map((_, i) => (
          <Container16 key={i} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard3() {
  return (
    <div className="h-[52.493px] relative shrink-0 w-full" data-name="ProjectCard">
      <div aria-hidden="true" className="absolute border-[0.502px_0px_0px] border-slate-200 border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex h-[52.493px] items-center justify-between pb-0 pt-[0.502px] px-0 relative w-full">
          <Container15 />
          <Container18 />
        </div>
      </div>
    </div>
  );
}

function CardContent() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[19.992px] items-start pb-0 pt-[23.997px] px-[23.997px] relative rounded-bl-[14px] rounded-br-[14px] shrink-0 w-[346.196px]" data-name="CardContent">
      <ProjectCard />
      <ProjectCard1 />
      <ProjectCard2 />
      <ProjectCard3 />
    </div>
  );
}

export default function Frame2() {
  return (
    <div className="box-border content-stretch flex flex-col items-start relative rounded-[14px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)] size-full">
      <Frame1 />
      <CardContent />
    </div>
  );
}