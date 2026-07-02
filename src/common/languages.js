import flagus from "../assets/images/flags/us.svg";
import flagspain from "../assets/images/flags/spain.svg";
import flaggermany from "../assets/images/flags/germany.svg";
import flagitaly from "../assets/images/flags/italy.svg";
import flagrussia from "../assets/images/flags/russia.svg";
import flagchina from "../assets/images/flags/china.svg";
import flagfrench from "../assets/images/flags/french.svg";
import flagarabic from "../assets/images/flags/ae.svg";
import flaghebrew from "../assets/images/flags/il.svg";
import flagindia from "../assets/images/flags/in.svg";


const languages = {
  en: {
    label: "English",
    flag: flagus,
    dir: "ltr",
  },
  hn: {
    label: "Hindi",
    flag: flagindia,
    dir: "ltr",
  },
  gj: {
    label: "Gujarati",
    flag: flagindia,
    dir: "ltr",
  },
  cn: {
    label: "Chinese",
    flag: flagchina,
    dir: "ltr",
  },
  fr: {
    label: "français",
    flag: flagfrench,
    dir: "ltr",
  },
  ar: {
    label: "Arabic",
    flag: flagarabic,
    dir: "rtl",
  },
  hb: {
    label: "Hebrew",
    flag: flaghebrew,
    dir: "rtl",
  },
  sp: {
    label: "Española",
    flag: flagspain,
    dir: "ltr",
  },
  rs: {
    label: "Russia",
    flag: flagrussia,
    dir: "ltr",
  },
  // gr: {
  //   label: "Deutsche",
  //   flag: flaggermany,
  //   dir: "ltr",
  // },
  // it: {
  //   label: "Italiana",
  //   flag: flagitaly,
  //   dir: "ltr",
  // },
};

export default languages;
