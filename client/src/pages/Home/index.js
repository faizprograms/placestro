import {useEffect,React} from "react";
import {useHistory} from "react-router-dom";

import Footer from "../../components/Footer";
import FloatingIcon from '../../components/FloatingIcon';

import "./style.css";

import hero from "../../img/hero.png";
import search from "../../img/search.jpg";
import gothrough from "../../img/gothrough.jpg";
import prepare from "../../img/prepare.jpg";
import nailitdown from "../../img/nailitdown.jpg";

import tcs from "../../img/company/tcs.png";
import zoho from "../../img/company/zoho.png";
import wipro from "../../img/company/wipro.png";
import softsquare from "../../img/company/softsquare.png";
import mobius from "../../img/company/mobius.png";
import vcidex from "../../img/company/vcidex.png";
import jilaba from "../../img/company/jilaba.png";
import avasoft from "../../img/company/avasoft.png";
import chainsys from "../../img/company/chainsys.png";
import zuci from "../../img/company/zuci.png";
import centizen from "../../img/company/centizen.png";
import ami from "../../img/company/ami.png";
import smackcoders from "../../img/company/smackcoders.png";
import datalogic from "../../img/company/datalogic.png";
import gigamon from "../../img/company/gigamon.png";
import klenty from "../../img/company/klenty.png";
import infosys from "../../img/company/infosys.png";
import Capgemini from "../../img/company/Capgemini.png";



import askQuestion from "../../utils/askQuestion";
import {askFeedBack} from "../../utils/askQuestion";



function Home() {

   const history=useHistory();

    useEffect(()=>{
        askQuestion(history);
        askFeedBack()
    },[askQuestion])
    
    return ( <>
        <FloatingIcon url={"https://t.me/+9_4feGpoutgwMjc1"} fbtype={"tg"}/>
        <FloatingIcon url={"https://chat.whatsapp.com/FbevGeS7EsEDkqiyimHtzX"} fbtype={"wb"}/>
        <div className="hero_container">
           <div className="hero_text">
              <h1> Find the company that suits You </h1>
              <p>Make use of the interview process and reviews<br/>
                to get placed in the company.</p>
              <div className="hero_button">
                 <a href="/signin">
                 <input type="button" name="signin" value="Sign in" className="hero_button1" />
                 </a>
                 <a href="/companies">
                 <input type="button" name="companies" value="Companies" className="hero_button2 " />
                 </a>
              </div>
           </div>
           <div className="hero_img">
              <img src={hero} alt="hero" />
           </div>
        </div>
        <section className="section_container">
                <h2 className="section_title">How it Works? </h2>
                <div className="how_itworks_container">
                    <div className="how_itworks-card">
                       <img  className="how_itworks-img" src={search}/>
                       <p className="how_itworks-text-bold">1.Search</p>
                       <p className="how_itworks-text">
                       Search for the company you looking for.</p>
                    </div>
                     <div className="how_itworks-card">
                       <img  className="how_itworks-img" src={gothrough}/>
                       <p className="how_itworks-text-bold">2.Go through </p>
                       <p className="how_itworks-text">
                       Go through the interview process and reviews
                        about the company.
                       </p>
                    </div>
                     <div className="how_itworks-card">
                       <img  className="how_itworks-img" src={prepare}/>
                        <p className="how_itworks-text-bold">3.Prepare </p>
                       <p className="how_itworks-text">
                       Prepare for the interview based on the interview process.</p>
                    </div>
                     <div className="how_itworks-card">
                        <img  className="how_itworks-img" src={nailitdown}/>
                        <p className="how_itworks-text-bold">4.Nail it down </p>
                        <p className="how_itworks-text">
                        Get placed in your dream company. </p>
                    </div>
                </div>

        </section>
     
      
     
        <Footer/>
    </>);
}

export default Home;
